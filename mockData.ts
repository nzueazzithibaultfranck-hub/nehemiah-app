import { NationalData, User, Notification } from './types';
import { ROLES } from './permissions';

// --- Helper Function ---
const slugify = (text: string) => text.toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars except -
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text

// --- Data Generation ---

const regionNames = [
    'ABIDJAN NORD', 'ABIDJAN OUEST 1', 'ABIDJAN OUEST 2', 'ABIDJAN SUD', 'BANGOLO', 
    'BIANKOUMA', 'BOUAKÉ', 'DALOA', 'DANANÉ', 'DUÉKOUÉ', 'GAGNOA', 'GUIGLO', 
    'ISSIA', 'KOUIBLY', 'LOGOUALÉ', 'MAHAPLÉU', 'MAN-NORD', 'MAN-SUD', 
    'SANGOUINÉ', 'SAN-PEDRO', 'SOUBRÉ', 'TABOU', 'ZOUAN-HOUNIEN'
];

const generatedData: NationalData = {
    bureau: [{ id: 'nb_1', name: 'Président National', position: 'Président', contact: '00000000' }],
    activities: [],
    regions: {},
    churches: {}
};

const generatedUsers: User[] = [
    { 
        id: 'user_national_admin', 
        username: 'national_admin', 
        roleId: 'national_admin', 
        level: 'national', 
        permissions: ROLES['national_admin'].permissions 
    }
];

regionNames.forEach(regionName => {
    const regionSlug = slugify(regionName);
    const regionId = `reg_${regionSlug}`;

    const region = {
        id: regionId,
        name: regionName,
        churches: [] as string[],
        bureau: [],
        activities: [],
    };

    generatedData.regions[regionId] = region;

    generatedUsers.push({
        id: `user_region_${regionSlug}`,
        username: `region_${regionSlug}_admin`,
        roleId: 'region_admin',
        level: 'region',
        regionId: regionId,
        permissions: ROLES['region_admin'].permissions,
    });

    for (let i = 1; i <= 30; i++) {
        const churchName = `${regionName}-${i}`;
        const churchSlug = slugify(churchName);
        const churchId = `church_${churchSlug}`;

        const church = {
            id: churchId,
            name: churchName,
            regionId: regionId,
            worshipServices: [],
            baptizedMembers: [],
            activities: [],
            bureau: [],
            announcements: [],
        };

        // For the first church of each region, add some mock members
        if (i === 1) {
            for (let j = 1; j <= 15; j++) {
                church.baptizedMembers.push({
                    id: `bm_${churchSlug}_${j}`,
                    fullName: `Membre ${regionName} ${j}`,
                    gender: j % 2 === 0 ? 'female' : 'male',
                    dateOfBirth: `19${80 + j}-0${(j % 9) + 1}-${10 + j}`,
                    dateOfBaptism: `201${(j % 9)}-0${(j % 9) + 1}-${10 + j}`,
                    phone: `01020304${10 + j}`,
                    email: `membre.${j}@${churchSlug}.com`,
                    address: `${j} Rue de la Paix`,
                    notes: 'Membre fidèle.'
                });
            }
        }
        
        generatedData.churches[churchId] = church;
        region.churches.push(churchId);

        generatedUsers.push({
            id: `user_church_${churchSlug}`,
            username: `church_${churchSlug}_admin`,
            roleId: 'church_admin',
            level: 'church',
            regionId: regionId,
            churchId: churchId,
            permissions: ROLES['church_admin'].permissions,
        });
    }
});


export const initialUsers: User[] = generatedUsers;

export const initialData: { data: NationalData, notifications: Notification[] } = {
    data: generatedData,
    notifications: []
};