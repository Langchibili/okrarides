
// PATH: driver/lib/api/vehicle.js  (DELIVERY FRONTEND — changed lines only)
// Full file — paste over the existing vehicle.js.
// Three endpoint changes:
//   getDriverVehicle      → /delivery-driver/vehicle
//   addVehicle            → /delivery-driver/onboarding/vehicle-details
//   submitForVerification → /delivery-driver/onboarding/submit
// Everything else is identical to the ride driver version.

import { apiClient } from './client';

export const getVehicles = async () => {
  try {
    return await apiClient.get('/driver/vehicles');
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

export const getVehicleMakesAndModels = async (type) => {
  const defaultMakesAndModels = {
    Toyota: ['Corolla', 'Camry', 'Hilux', 'Land Cruiser', 'RAV4', 'HiAce', 'Probox'],
    Nissan: ['Navara', 'Patrol', 'X-Trail', 'Frontier', 'NV200'],
    Honda:  ['Fit', 'CR-V', 'City', 'Accord', 'Ridgeline'],
    Ford:   ['Ranger', 'F-150', 'Transit', 'Maverick'],
    Isuzu:  ['D-Max', 'MU-X', 'NPR'],
    Mitsubishi: ['L200', 'Pajero', 'Outlander'],
    Mercedes: ['Sprinter', 'Vito', 'Actros'],
    Volkswagen: ['Amarok', 'Transporter', 'Caddy'],
    Bajaj:  ['Boxer', 'Pulsar', 'CT100'],
    Honda:  ['CB125', 'CB150', 'CG125'],
    Yamaha: ['YBR125', 'FZ150', 'NMAX'],
    Suzuki: ['GN125', 'GS150', 'Carry'],
  }
  const defaultMotorBikeMakesAndModels = {
    BMW: ["S1000RR","S1000XR","R1300GS","R1300GS Adventure","R18","F900R","F900XR","F450GS","R1250RT","K1600GT","G310R","M1000RR"],
    KTM: ["1290 Super Duke R","890 Duke R","390 Duke","890 Adventure","1290 Super Adventure R","RC390","450 Rally","690 Enduro R"],
    TVS: ["Apache RTR 160","Ronin","iQube"],
    Hero: ["Xpulse 200","Karizma XMR","Splendor"],
    Zero: ["SR/F","SR/S","FXE","DSR/X","X"],
    Bajaj: ["Pulsar NS200","Dominar 400","Avenger"],
    Honda: ["CBR1000RR","CBR600RR","Africa Twin","Africa Twin Adventure Sports","Gold Wing","Gold Wing Tour","Rebel 500","Rebel 1100","CB500F","CB650R","CRF450R","CRF300L","NT1100","Forza 750","PCX150","ADV350","CRF1100L","Transalp"],
    Lotus: ["Eletre"],
    Vespa: ["Primavera","Sprint","GTS 300","GTS Super","Sei Giorni"],
    CFMoto: ["450CL-C","800MT","675NK","300NK"],
    Ducati: ["Panigale V4","Monster","Multistrada V4","DesertX","XDiavel","Streetfighter V4","Scrambler","Diavel V4","Hypermotard","SuperSport 950"],
    Indian: ["Challenger","Chief","Scout","Roadmaster","Sport Chief","Chieftain","FTR"],
    Suzuki: ["GSX-R1000","GSX-R750","GSX-S750","Hayabusa","V-Strom 650","V-Strom 1050","SV650","DR650S","Katana","Boulevard M109R","GSX-8S","GSX-8R"],
    Yamaha: ["YZF-R1","YZF-R7","MT-09","MT-07","Tracer 9 GT","Tenere 700","XMAX 300","Super Tenere","YZF-R3","MT-03","R3","YZF-R6","Bolt","XSR900","Ténéré 700 Rally"],
    Aprilia: ["RSV4","RS660","Tuono 660","Tuareg 660","RS457","Tuono 457"],
    Benelli: ["Tornado 550","TRK 502","TRK 602","Leonino"],
    Piaggio: ["Liberty","MP3","Beverly"],
    Polaris: ["Slingshot"],
    Triumph: ["Speed Triple 1200","Bonneville T120","Tiger 900","Rocket 3","Street Twin","Speed Twin 900","Trident 660","Tiger 1200","Daytona 660"],
    Energica: ["Experia","Eva Ribelle"],
    Kawasaki: ["Ninja ZX-10R","Ninja ZX-6R","Ninja 400","Z900","Z650","Versys 650","Versys 1000","Vulcan 900","KLR650","KX450","KLE500","Ninja ZX-4RR","Z900RS"],
    Husqvarna: ["Norden 901","Vitpilen 401","Svartpilen 401","701 Enduro","701 Supermoto"],
    "MV Agusta": ["F3","Superveloce","Brutale","Dragster"],
    "Moto Guzzi": ["V7","V9","V100 Mandello","Stelvio"],
    "Royal Enfield": ["Meteor 350","Classic 350","Himalayan","Bear 650","Guerrilla 450","Continental GT 650","Interceptor 650","Super Meteor 650"],
    "Harley-Davidson": ["Street Glide","Road Glide","Sportster S","Pan America","Heritage Classic","Fat Boy","Breakout","Low Rider ST","CVO Road Glide","Nightster","Iron 883","Softail Standard"],
  }
  const defaultBicycleMakesAndModels = {
    Trek: ["Madone SLR","Domane SL","Emonda SLR","Fuel EX","Slash","Marlin 7","FX 3","Allant+","Verve 3","Rail 5","Top Fuel","Procaliber"],
    Specialized: ["Tarmac SL7","Roubaix","Diverge STR","Stumpjumper","Epic EVO","Turbo Levo","Rockhopper","Sirrus","Creo SL","Enduro","Chisel"],
    Giant: ["TCR Advanced","Defy Advanced","Contend AR","Anthem Advanced","Trance X","Reign Advanced","Talon","Escape 3","Contessa","Stance"],
    Cannondale: ["SuperSix Evo","Synapse","Topstone","Jekyll","Habit","Scalpel","CAAD Optimo","SystemSix","Moterra","Trail"],
    Scott: ["Addict RC","Foil RC","Spark RC","Genius","Aspect","Scale","Contessa Scale","Ransom","Voltage"],
    SantaCruz: ["Hightower","5010","Tallboy","Bronson","Chameleon","Nomad","Megatower","Blur"],
    BMC: ["Teammachine","Roadmachine","Urs","Kaius","Fourstroke","Twostroke","Alpenchallenge"],
    Canyon: ["Ultimate","Aeroad","Grail","Spectral","Torque","Grand Canyon","Stoic","Pathlite"],
    Pinarello: ["Dogma F","Dogma FS","Prince","Gan","X9","Grax"],
    Cervelo: ["S5","R5","Áspero","Caledonia","Soloist","P5"],
    Bianchi: ["Oltre XR4","Aria","Specialissima","Impulso","Methan","Arcadex"],
    Orbea: ["Orca","Aqua","Alma","Occam","Rise","Wild","Gain"],
    Cube: ["Agree","Attain","Litening","Stereo","AMS","Reaction","Ella"],
    Merida: ["Reacto","Scultura","Big Nine","Big Trail","eSpresso","Crossway"],
    RockyMountain: ["Instinct","Growler","Pipeline","Altitude","Thunderbolt","Solo"],
    Yeti: ["SB140","SB130","SB165","ARC","450","Bet"],
    Brompton: ["C Line","A Line","P Line","H Line","T Line","Electric"],
    Raleigh: ["Revenge","Cadent","Tamland","Redux","Rushhour"],
  }

  try {
    const response = await apiClient.get('/vehicle-makes-and-model');
    if(type === "motorbike"){
      return response?.data?.motorbikes || defaultMotorBikeMakesAndModels
    }
    else if(type === "bike"){
      return response?.data?.bikes || defaultBicycleMakesAndModels
    }
    return response?.data?.list || defaultMakesAndModels;
  } catch {
    return defaultMakesAndModels;
  }
}


export const getAllowedVehicleYears = async () => {
  try {
    const response = await apiClient.get('/allowed-vehicle-year');
    return response?.data?.years || ['2000','2005','2010','2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];
  } catch {
    return ['2010','2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];
  }
};

export const getVehicleDetails = async () => {
  try {
    return await apiClient.get('/driver/get-vehicle-details');
  } catch (error) {
    throw error;
  }
};

export const getDriverVehicles = async () => {
  try {
    return await apiClient.get('/driver/vehicles');
  } catch (error) {
    throw error;
  }
};

export const updateDriverAssignedVehicle = async (vehicleData) => {
  try {
    return await apiClient.put('/driver/vehicles/assigned-vehicle', vehicleData);
  } catch (error) {
    throw error;
  }
};

export const updateVehicleDetails = async (vehicleData) => {
  try {
    return await apiClient.put('/driver/update-vehicle-details', vehicleData);
  } catch (error) {
    throw error;
  }
};

export const saveVehicleDetails = async (vehicleData) => {
  try {
    return await apiClient.post('/delivery-driver/onboarding/vehicle-details', vehicleData);
  } catch (error) {
    throw error;
  }
};

// ─── Delivery vehicle CRUD ────────────────────────────────────────────────────

export const getDriverVehicle = async () => {
  try {
    const response = await apiClient.get('/delivery-driver/vehicle');
    return response;
  } catch (error) {
    console.error('[vehicle.js] getDriverVehicle error:', error);
    throw error;
  }
};

/**
 * Extract the active vehicle from an already-loaded deliveryProfile object.
 * Call this instead of getDriverVehicle() when you already have the profile
 * in state — avoids a duplicate network request.
 *
 * Returns the same shape as the API: { success, hasVehicle, activeVehicleType, vehicle }.
 */
export const getVehicleFromDeliveryProfile = (deliveryProfile) => {
  // console.log('[getVehicleFromDeliveryProfile] raw deliveryProfile:', {
  //   activeVehicleType: deliveryProfile?.activeVehicleType,
  //   taxi:       deliveryProfile?.taxi       ? { id: deliveryProfile.taxi.id,       isActive: deliveryProfile.taxi.isActive,       vehicleId: deliveryProfile.taxi.vehicle?.id       ?? null } : null,
  //   motorbike:  deliveryProfile?.motorbike  ? { id: deliveryProfile.motorbike.id,  isActive: deliveryProfile.motorbike.isActive,  vehicleId: deliveryProfile.motorbike.vehicle?.id  ?? null } : null,
  //   motorcycle: deliveryProfile?.motorcycle ? { id: deliveryProfile.motorcycle.id, isActive: deliveryProfile.motorcycle.isActive, vehicleId: deliveryProfile.motorcycle.vehicle?.id ?? null } : null,
  //   truck:      deliveryProfile?.truck      ? { id: deliveryProfile.truck.id,      isActive: deliveryProfile.truck.isActive,      vehicleId: deliveryProfile.truck.vehicle?.id      ?? null } : null,
  // })

  if (!deliveryProfile) {
    //console.log('[getVehicleFromDeliveryProfile] ❌ no deliveryProfile');
    return { success: false, hasVehicle: false, vehicle: null, activeVehicleType: null };
  }

  const activeType = deliveryProfile.activeVehicleType;
  //console.log('[getVehicleFromDeliveryProfile] activeType =', activeType);

  if (!activeType || activeType === 'none') {
    //console.log('[getVehicleFromDeliveryProfile] ⏭ activeVehicleType is none/null');
    return { success: true, hasVehicle: false, vehicle: null, activeVehicleType: activeType };
  }

  const subComponent = deliveryProfile[activeType];
  const vehicle      = subComponent?.vehicle ?? null;

  // console.log('[getVehicleFromDeliveryProfile] subComponent =', subComponent);
  // console.log('[getVehicleFromDeliveryProfile] vehicle =', vehicle);
  // console.log('[getVehicleFromDeliveryProfile] result → hasVehicle =', !!vehicle);

  return {
    success:           true,
    hasVehicle:        !!vehicle,
    activeVehicleType: activeType,
    vehicle,
  };
};

/**
 * Save vehicle basic info + attach it to the delivery profile sub-component.
 * POST /delivery-driver/onboarding/vehicle-details
 */
export const addVehicle = async (vehicleData) => {
  try {
    const response = await apiClient.post('/delivery-driver/onboarding/vehicle-details', vehicleData);
    return response;
  } catch (error) {
    console.error('[vehicle.js] addVehicle error:', error);
    throw error;
  }
};

/**
 * Update an existing vehicle record's fields.
 * PUT /vehicles/:id  (generic Strapi endpoint — updates the Vehicle collection entry only).
 * After calling this you should also call addVehicle() to re-sync the sub-component relation.
 */
export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const response = await apiClient.put(`/vehicles/${vehicleId}`, { data: vehicleData });
    return response?.data
      ? { vehicle: response.data, success: true, hasVehicle: true }
      : { vehicle: null, success: false, hasVehicle: false };
  } catch (error) {
    console.error('[vehicle.js] updateVehicle error:', error);
    throw error;
  }
};

/**
 * Submit vehicle + documents for admin verification.
 * POST /delivery-driver/onboarding/submit
 */
export const submitForVerification = async () => {
  try {
    return await apiClient.post('/delivery-driver/onboarding/submit');
  } catch (error) {
    console.error('[vehicle.js] submitForVerification error:', error);
    throw error;
  }
};