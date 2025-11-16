
// utils/pdfExporter.ts

// This declaration reflects how the CDN scripts interact.
// The autotable plugin patches the global jsPDF object.
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (options?: any) => any;
    };
    // The autotable plugin attaches itself to window.jsPDF.
    // An instance created with `new window.jsPDF()` will have an `autoTable` method.
    jsPDF: any;
  }
}

import { Church, NationalData, Region } from '../types';

const toFilename = (name: string) => name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

export const exportChurchMonthlyReportPDF = (church: Church, year: number, month: number) => {
  const doc = new window.jsPDF();
  
  const monthDate = new Date(year, month - 1);
  const monthName = monthDate.toLocaleString('fr-FR', { month: 'long' });
  const reportTitle = `Rapport Mensuel - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  const churchName = `Église: ${church.name}`;

  // Filter data for the selected month
  const servicesThisMonth = church.worshipServices.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month - 1;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const activitiesThisMonth = church.activities.filter(a => {
    const d = new Date(a.date);
    return d.getFullYear() === year && d.getMonth() === month - 1;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate stats
  const validatedServices = servicesThisMonth.filter(s => s.status === 'validated');
  const totalOffering = validatedServices.reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
  const totalAttendance = validatedServices.reduce((sum, s) => sum + s.attendance.men + s.attendance.women + s.attendance.children, 0);
  const avgAttendance = validatedServices.length > 0 ? Math.round(totalAttendance / validatedServices.length) : 0;

  // --- PDF Content ---

  // Header
  doc.setFontSize(18);
  doc.text(reportTitle, 14, 22);
  doc.setFontSize(12);
  doc.text(churchName, 14, 30);

  // Summary section
  doc.setFontSize(12);
  doc.text('Résumé du mois', 14, 45);
  (doc as any).autoTable({
    startY: 50,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Membres Baptisés (Total Église)', church.baptizedMembers.length.toLocaleString()],
      ['Offrandes Validées du Mois', `${totalOffering.toLocaleString()} FCFA`],
      ['Présence Moyenne du Mois', avgAttendance.toLocaleString()],
      ['Rapports Soumis ce Mois', servicesThisMonth.length],
      ['Activités Organisées ce Mois', activitiesThisMonth.length],
    ],
    theme: 'grid',
    styles: { fontSize: 10 },
  });

  let lastTableY = (doc as any).lastAutoTable.finalY;

  // Worship Services table
  if (servicesThisMonth.length > 0) {
    doc.text('Détail des Cultes du Mois', 14, lastTableY + 15);
    (doc as any).autoTable({
      startY: lastTableY + 20,
      head: [['Date', 'Orateur', 'Présence', 'Offrandes (FCFA)', 'Statut']],
      body: servicesThisMonth.map(s => [
        s.date,
        s.speaker,
        (s.attendance.men + s.attendance.women + s.attendance.children).toLocaleString(),
        (s.offering.tithes + s.offering.regular + s.offering.special).toLocaleString(),
        s.status,
      ]),
      theme: 'striped',
      styles: { fontSize: 9 },
    });
    lastTableY = (doc as any).lastAutoTable.finalY;
  }

  // Activities table
  if (activitiesThisMonth.length > 0) {
    doc.text('Détail des Activités du Mois', 14, lastTableY + 15);
    (doc as any).autoTable({
      startY: lastTableY + 20,
      head: [['Date', 'Titre', 'Type']],
      body: activitiesThisMonth.map(a => [
        a.date,
        a.title,
        a.type,
      ]),
      theme: 'striped',
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} sur ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 10);
  }

  // Save the PDF
  const filename = `Rapport_${toFilename(church.name)}_${year}_${month}.pdf`;
  doc.save(filename);
};


export const exportRegionMonthlyReportPDF = (region: Region & { churchesData: Church[] }, year: number, month: number) => {
    const doc = new window.jsPDF();

    const monthDate = new Date(year, month - 1);
    const monthName = monthDate.toLocaleString('fr-FR', { month: 'long' });
    const reportTitle = `Rapport de Synthèse Régional - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    const regionName = `Région: ${region.name}`;

    // Calculate stats for each church and for the whole region
    let regionTotalOffering = 0;
    let regionTotalAttendance = 0;
    let regionValidatedServicesCount = 0;

    const churchStats = region.churchesData.map(church => {
        const servicesThisMonth = church.worshipServices.filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === year && d.getMonth() === month - 1;
        });
        const validatedServices = servicesThisMonth.filter(s => s.status === 'validated');
        const totalOffering = validatedServices.reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
        const totalAttendance = validatedServices.reduce((sum, s) => sum + s.attendance.men + s.attendance.women + s.attendance.children, 0);
        const avgAttendance = validatedServices.length > 0 ? Math.round(totalAttendance / validatedServices.length) : 0;
        
        regionTotalOffering += totalOffering;
        regionTotalAttendance += totalAttendance;
        regionValidatedServicesCount += validatedServices.length;

        return {
            name: church.name,
            members: church.baptizedMembers.length,
            offering: totalOffering,
            avgAttendance: avgAttendance
        };
    });

    const regionAvgAttendance = regionValidatedServicesCount > 0 ? Math.round(regionTotalAttendance / regionValidatedServicesCount) : 0;
    
    const activitiesThisMonth = region.activities.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month - 1;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- PDF Content ---
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(12);
    doc.text(regionName, 14, 30);

    // Summary section
    doc.text('Résumé de la Région', 14, 45);
    (doc as any).autoTable({
        startY: 50,
        head: [['Indicateur Régional', 'Valeur']],
        body: [
            ['Nombre d\'Églises', region.churchesData.length.toLocaleString()],
            ['Total des Membres', region.churchesData.reduce((sum, c) => sum + c.baptizedMembers.length, 0).toLocaleString()],
            ['Offrandes Totales du Mois', `${regionTotalOffering.toLocaleString()} FCFA`],
            ['Présence Moyenne Régionale', regionAvgAttendance.toLocaleString()],
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
    });

    let lastTableY = (doc as any).lastAutoTable.finalY;

    // Churches comparison table
    doc.text('Statistiques par Église pour le Mois', 14, lastTableY + 15);
    (doc as any).autoTable({
      startY: lastTableY + 20,
      head: [['Église', 'Membres', 'Offrandes (FCFA)', 'Présence Moy.']],
      body: churchStats.map(s => [
        s.name,
        s.members.toLocaleString(),
        s.offering.toLocaleString(),
        s.avgAttendance.toLocaleString(),
      ]),
      theme: 'striped',
      styles: { fontSize: 9 },
    });

    lastTableY = (doc as any).lastAutoTable.finalY;

    // Regional Activities
    if(activitiesThisMonth.length > 0) {
        doc.text('Activités du Bureau Régional', 14, lastTableY + 15);
        (doc as any).autoTable({
            startY: lastTableY + 20,
            head: [['Date', 'Titre', 'Type']],
            body: activitiesThisMonth.map(a => [a.date, a.title, a.type]),
            theme: 'striped',
            styles: { fontSize: 9 },
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} sur ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 10);
    }
    
    const filename = `Synthese_Regionale_${toFilename(region.name)}_${year}_${month}.pdf`;
    doc.save(filename);
};

export const exportNationalMonthlyReportPDF = (nationalData: NationalData, year: number, month: number) => {
    const doc = new window.jsPDF('landscape');

    const monthDate = new Date(year, month - 1);
    const monthName = monthDate.toLocaleString('fr-FR', { month: 'long' });
    const reportTitle = `Rapport de Synthèse National - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

    let totalChurches = 0;
    let totalMembers = 0;
    let nationalTotalOffering = 0;
    let nationalTotalAttendance = 0;
    let nationalValidatedServicesCount = 0;

    const regionStats = Object.values(nationalData.regions).map((region: Region) => {
        const churches = region.churches.map(id => nationalData.churches[id]).filter(Boolean);
        let regionTotalOffering = 0;
        let regionTotalAttendance = 0;
        let regionValidatedServicesCount = 0;

        churches.forEach(church => {
            const servicesThisMonth = church.worshipServices.filter(s => {
                const d = new Date(s.date);
                return d.getFullYear() === year && d.getMonth() === month - 1;
            });
            const validatedServices = servicesThisMonth.filter(s => s.status === 'validated');
            const totalOffering = validatedServices.reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
            const totalAttendance = validatedServices.reduce((sum, s) => sum + s.attendance.men + s.attendance.women + s.attendance.children, 0);

            regionTotalOffering += totalOffering;
            regionTotalAttendance += totalAttendance;
            regionValidatedServicesCount += validatedServices.length;
        });

        const regionMembers = churches.reduce((sum, c) => sum + c.baptizedMembers.length, 0);
        const regionAvgAttendance = regionValidatedServicesCount > 0 ? Math.round(regionTotalAttendance / regionValidatedServicesCount) : 0;
        
        totalChurches += churches.length;
        totalMembers += regionMembers;
        nationalTotalOffering += regionTotalOffering;
        nationalTotalAttendance += regionTotalAttendance;
        nationalValidatedServicesCount += regionValidatedServicesCount;
        
        return {
            name: region.name,
            churches: churches.length,
            members: regionMembers,
            offering: regionTotalOffering,
            avgAttendance: regionAvgAttendance
        };
    });
    
    const nationalAvgAttendance = nationalValidatedServicesCount > 0 ? Math.round(nationalTotalAttendance / nationalValidatedServicesCount) : 0;
    
    const activitiesThisMonth = nationalData.activities.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month - 1;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- PDF Content ---
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    
    doc.setFontSize(12);
    doc.text('Résumé National', 14, 40);
    (doc as any).autoTable({
        startY: 45,
        head: [['Indicateur National', 'Valeur']],
        body: [
            ['Nombre de Régions', Object.keys(nationalData.regions).length.toLocaleString()],
            ['Nombre Total d\'Églises', totalChurches.toLocaleString()],
            ['Total des Membres', totalMembers.toLocaleString()],
            ['Offrandes Totales du Mois', `${nationalTotalOffering.toLocaleString()} FCFA`],
            ['Présence Moyenne Nationale', nationalAvgAttendance.toLocaleString()],
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
    });

    let lastTableY = (doc as any).lastAutoTable.finalY;

    // Regions comparison table
    doc.text('Statistiques par Région pour le Mois', 14, lastTableY + 15);
    (doc as any).autoTable({
      startY: lastTableY + 20,
      head: [['Région', 'Églises', 'Membres', 'Offrandes (FCFA)', 'Présence Moy.']],
      body: regionStats.map(s => [
        s.name,
        s.churches.toLocaleString(),
        s.members.toLocaleString(),
        s.offering.toLocaleString(),
        s.avgAttendance.toLocaleString(),
      ]),
      theme: 'striped',
      styles: { fontSize: 9 },
    });
    
     lastTableY = (doc as any).lastAutoTable.finalY;

    // National Activities
    if(activitiesThisMonth.length > 0) {
        doc.text('Activités du Bureau National', 14, lastTableY + 15);
        (doc as any).autoTable({
            startY: lastTableY + 20,
            head: [['Date', 'Titre', 'Type']],
            body: activitiesThisMonth.map(a => [a.date, a.title, a.type]),
            theme: 'striped',
            styles: { fontSize: 9 },
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} sur ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 10);
    }
    
    const filename = `Synthese_Nationale_${year}_${month}.pdf`;
    doc.save(filename);
};
