import { apiClient } from './client';

//==========================================
// VEHICLE MANAGEMENT
//==========================================
export const getVehicles = async () => {
  try {
    const response = await apiClient.get('/driver/vehicles');
    return response;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
}

export const getVehicleMakesAndModels = async () => {
  const defaultMakesAndModels = {
  "Toyota": ["Avalon", "bZ3", "Camry", "Camry Hybrid", "Century", "Corolla", "Corolla Hatchback", "Crown Sedan", "GR86", "GR Corolla", "GR Supra", "GR Yaris", "Mirai", "Prius", "Prius Prime", "Vios/Yaris", "4Runner", "bZ4X", "C-HR", "Corolla Cross", "Crown Crossover", "Crown Signia", "Fortuner", "Grand Highlander", "Highlander/Kluger", "Land Cruiser", "Land Cruiser Prado", "RAV4", "RAV4 Hybrid", "RAV4 Prime", "Sequoia", "Venza/Harrier", "Yaris Cross", "Hilux", "Tacoma", "Tundra", "Sienna", "Agya/Wigo", "Alphard", "Aqua", "Granvia", "HiAce", "Probox/Succeed", "Vellfire"],
  "Nissan": ["Altima", "Leaf", "Maxima", "Sentra", "Skyline", "Versa", "Z", "GT-R", "Z NISMO", "Armada", "Ariya", "Kicks", "Murano", "Pathfinder", "Patrol", "Qashqai", "Rogue", "Rogue Sport", "Terra", "X-Terra", "X-Trail", "Frontier", "Navara", "Titan", "NV200", "NV Cargo", "NV Passenger", "Quest", "Serena"],
  "Honda": ["Accord", "Accord Hybrid", "City", "Civic", "Civic Hatchback", "Civic Hybrid", "Civic Si", "Civic Type R", "Clarity", "Fit", "Grace", "Insight", "Integra", "Breeze", "BR-V", "CR-V", "CR-V Hybrid", "CR-V e:FCEV", "Elevate", "HR-V", "Passport", "Pilot", "Prologue", "WR-V", "ZR-V", "Odyssey", "Shuttle", "Stepwgn", "Ridgeline"],
  "Ford": ["Mustang", "Mustang Mach-E", "Bronco", "Bronco Sport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-150 Lightning", "F-250 Super Duty", "F-350 Super Duty", "Maverick", "Ranger", "Transit", "E-Transit"],
  "Chevrolet": ["Blazer", "Blazer EV", "Bolt EUV", "Camaro", "Corvette", "Corvette E-Ray", "Corvette Z06", "Corvette ZR1", "Equinox", "Equinox EV", "Malibu", "Suburban", "Tahoe", "Trailblazer", "Traverse", "Trax", "Colorado", "Silverado 1500", "Silverado EV", "Silverado 2500 HD", "Silverado 3500 HD"],
  "GMC": ["Acadia", "Canyon", "Hummer EV Pickup", "Hummer EV SUV", "Savana Cargo", "Savana Passenger", "Sierra 1500", "Sierra EV", "Sierra 2500 HD", "Sierra 3500 HD", "Terrain", "Yukon", "Yukon XL"],
  "Ram": ["1500", "1500 REV", "1500 Ramcharger", "2500", "3500", "ProMaster"],
  "Dodge": ["Challenger", "Charger", "Durango", "Hornet"],
  "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee 4xe", "Grand Wagoneer", "Renegade", "Wagoneer", "Wagoneer S", "Wrangler", "Wrangler 4xe"],
  "Mazda": ["Mazda3 Sedan", "Mazda3 Hatchback", "MX-5 Miata", "CX-30", "CX-5", "CX-50", "CX-50 Hybrid", "CX-70", "CX-70 PHEV", "CX-90", "CX-90 PHEV"],
  "Subaru": ["Ascent", "BRZ", "Crosstrek", "Crosstrek Hybrid", "Forester", "Forester Hybrid", "Impreza", "Legacy", "Outback", "Solterra", "WRX"],
  "Mitsubishi": ["Mirage", "Outlander", "Outlander PHEV", "Outlander Sport", "Eclipse Cross"],
  "Hyundai": ["Accent", "Elantra", "Elantra Hybrid", "Elantra N", "Ioniq 5", "Ioniq 6", "Kona", "Kona Electric", "Palisade", "Santa Cruz", "Santa Fe", "Santa Fe Hybrid", "Sonata", "Sonata Hybrid", "Tucson", "Tucson Hybrid", "Tucson PHEV", "Venue"],
  "Kia": ["K4", "K5", "Carnival", "EV6", "EV9", "Forte", "Niro", "Niro EV", "Niro PHEV", "Seltos", "Sorento", "Sorento Hybrid", "Sorento PHEV", "Soul", "Sportage", "Sportage Hybrid", "Sportage PHEV", "Stinger", "Telluride"],
  "BMW": ["2 Series", "2 Series Gran Coupe", "3 Series", "4 Series", "5 Series", "5 Series e", "7 Series", "8 Series", "i4", "i5", "i7", "iX", "M2", "M3", "M4", "M5", "M8", "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z4"],
  "Mercedes-Benz": ["A-Class", "C-Class", "CLA", "CLE", "E-Class", "S-Class", "AMG GT", "EQB", "EQE", "EQS", "EQS SUV", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "Maybach S-Class", "SL"],
  "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "e-tron GT", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "RS3", "RS4", "RS5", "RS6", "RS7", "R8", "TT"],
  "Lexus": ["ES", "IS", "LS", "RC", "GX", "LX", "NX", "RX", "RX Hybrid", "RZ", "TX", "UX"],
  "Acura": ["Integra", "TLX", "ADX", "MDX", "MDX Type S", "RDX", "ZDX"],
  "Infiniti": ["Q50", "QX50", "QX55", "QX60", "QX80"],
  "Genesis": ["G70", "G80", "G90", "Electrified G80", "GV60", "GV70", "Electrified GV70", "GV80", "GV80 Coupe"],
  "Volkswagen": ["Arteon", "Atlas", "Atlas Cross Sport", "Golf", "Golf GTI", "Golf R", "ID.4", "Jetta", "Jetta GLI", "Passat", "Taos", "Tiguan"],
  "Volvo": ["C40 Recharge", "EX30", "EX90", "S60", "S90", "V60", "V90", "XC40", "XC40 Recharge", "XC60", "XC90"],
  "Porsche": ["718 Boxster", "718 Cayman", "911", "Cayenne", "Cayenne E-Hybrid", "Macan", "Macan EV", "Panamera", "Taycan"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Cadillac": ["CT4", "CT5", "Escalade", "Escalade ESV", "XT4", "XT5", "XT6", "Lyriq"],
  "Lincoln": ["Aviator", "Corsair", "Nautilus", "Navigator"],
  "Buick": ["Enclave", "Encore GX", "Envision", "Envista"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  "Maserati": ["Ghibli", "Levante", "Quattroporte", "GranTurismo", "GranCabrio", "MC20", "Grecale"],
  "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Rivian": ["R1T", "R1S"],
  "Lucid": ["Air"],
  "Polestar": ["Polestar 2", "Polestar 3", "Polestar 4"],
  "Ferrari": ["296 GTB", "296 GTS", "812 Competizione", "F8 Tributo", "F8 Spider", "Roma", "Portofino M", "SF90 Stradale", "SF90 Spider", "Purosangue"],
  "Lamborghini": ["Huracán", "Urus", "Revuelto"],
  "Bentley": ["Bentayga", "Continental GT", "Flying Spur"],
  "Rolls-Royce": ["Cullinan", "Ghost", "Phantom", "Spectre"],
  "McLaren": ["Artura", "GT", "720S", "765LT"],
  "Aston Martin": ["DB11", "DB12", "DBS", "DBX", "Vantage"],
  "Lotus": ["Eletre", "Emira", "Evija"],
  "Mini": ["Cooper", "Cooper Countryman", "Cooper Clubman", "Cooper SE Electric"],
  "Fiat": ["500", "500X"],
  "Chrysler": ["Pacifica", "Pacifica Hybrid", "300"],
  }
  try {
    const response = await apiClient.get('/vehicle-makes-and-model');
    return response?.data?.list || defaultMakesAndModels;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

export const getAllowedVehicleYears = async () => {
  try {
    const response = await apiClient.get('/allowed-vehicle-year');
    return response?.data?.years || ["1999", "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    throw error;
  }
}

export const getVehicleDetails = async () => {
  try {
    const response = await apiClient.get('/driver/get-vehicle-details');
    return response;
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    throw error;
  }
}
export const getDriverVehicle = async () => {
  try {
    const response = await apiClient.get('/driver/vehicle');
    console.log('driver vehicle',response)
    return response;
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    throw error;
  }
}
export const getDriverVehicles = async () => {
  try {
    const response = await apiClient.get('/driver/vehicles');
    console.log('driver vehicle',response)
    return response;
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    throw error;
  }
}



export const addVehicle = async (vehicleData) => {
  try {
    const response = await apiClient.post('/driver/onboarding/vehicle-details', vehicleData);
    console.log('response',response)
    return response;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const response = await apiClient.put(`/vehicles/${vehicleId}`, {data:vehicleData});
    return response;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
}
export const updateDriverAssignedVehicle = async (vehicleData) => {
  try {
    const response = await apiClient.put(`/driver/vehicles/assigned-vehicle`, vehicleData);
    return response;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

// For updating vehicle details (using the endpoint from the driver controller)
export const updateVehicleDetails = async (vehicleData) => {
  try {
    const response = await apiClient.put('/driver/update-vehicle-details', vehicleData);
    return response;
  } catch (error) {
    console.error('Error updating vehicle details:', error);
    throw error;
  }
};

// Save vehicle details during onboarding
export const saveVehicleDetails = async (vehicleData) => {
  try {
    const response = await apiClient.post('/driver/save-vehicle-details', vehicleData);
    return response;
  } catch (error) {
    console.error('Error saving vehicle details:', error);
    throw error;
  }
};