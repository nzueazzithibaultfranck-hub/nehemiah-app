// Fix: Corrected import path for DataService.
import DataService from "./services/data.service";

// We create a singleton instance of the DataService to be used throughout the app.
// This simulates a single connection to a backend.
const api = new DataService();

export { api };