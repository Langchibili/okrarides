// // PATH: lib/api/vehicles.js
// import { apiClient } from './client';

// export const getVehicleMakesAndModels = async (type) => {
//   try {
//     const res = await apiClient.get('/vehicle-makes-and-model');
//     if (type === 'motorbike' || type === 'motorcycle') return res?.data?.motorbikes ?? {};
//     return res?.data?.list ?? {};
//   } catch {
//     return {};
//   }
// };

// export const getAllowedVehicleYears = async () => {
//   try {
//     const res = await apiClient.get('/allowed-vehicle-year');
//     const years = res?.data?.years ?? [];
//     const cur = new Date().getFullYear();
//     const sorted = [...years].sort((a, b) => parseInt(a) - parseInt(b));
//     const last = parseInt(sorted[sorted.length - 1] ?? String(cur));
//     if (last >= cur) return sorted;
//     return [...sorted, ...Array.from({ length: cur - last + 1 }, (_, i) => String(last + i + 1))];
//   } catch {
//     const cur = new Date().getFullYear();
//     return Array.from({ length: cur - 2000 + 2 }, (_, i) => String(2000 + i));
//   }
// };
// PATH: lib/api/vehicles.js
import { apiClient } from './client';

const defaultVehicleMakesAndModels = {
  Toyota: [
    'Avalon', 'bZ3', 'Camry', 'Camry Hybrid', 'Century', 'Corolla',
    'Corolla Hatchback', 'Crown Sedan', 'GR86', 'GR Corolla', 'GR Supra',
    'GR Yaris', 'Mirai', 'Prius', 'Prius Prime', 'Vios/Yaris', '4Runner',
    'bZ4X', 'C-HR', 'Corolla Cross', 'Crown Crossover', 'Crown Signia',
    'Fortuner', 'Grand Highlander', 'Highlander/Kluger', 'Land Cruiser',
    'Land Cruiser Prado', 'RAV4', 'RAV4 Hybrid', 'RAV4 Prime', 'Sequoia',
    'Venza/Harrier', 'Yaris Cross', 'Hilux', 'Tacoma', 'Tundra', 'Sienna',
    'Agya/Wigo', 'Alphard', 'Aqua', 'Granvia', 'HiAce', 'Probox/Succeed',
    'Vellfire',
  ],
  Nissan: [
    'Altima', 'Leaf', 'Maxima', 'Sentra', 'Skyline', 'Versa', 'Z', 'GT-R',
    'Z NISMO', 'Armada', 'Ariya', 'Kicks', 'Murano', 'Pathfinder', 'Patrol',
    'Qashqai', 'Rogue', 'Rogue Sport', 'Terra', 'X-Terra', 'X-Trail',
    'Frontier', 'Navara', 'Titan', 'NV200', 'NV Cargo', 'NV Passenger',
    'Quest', 'Serena',
  ],
  Honda: [
    'Accord', 'Accord Hybrid', 'City', 'Civic', 'Civic Hatchback',
    'Civic Hybrid', 'Civic Si', 'Civic Type R', 'Clarity', 'Fit', 'Grace',
    'Insight', 'Integra', 'Breeze', 'BR-V', 'CR-V', 'CR-V Hybrid',
    'CR-V e:FCEV', 'Elevate', 'HR-V', 'Passport', 'Pilot', 'Prologue',
    'WR-V', 'ZR-V', 'Odyssey', 'Shuttle', 'Stepwgn', 'Ridgeline',
  ],
  Ford: [
    'Mustang', 'Mustang Mach-E', 'Bronco', 'Bronco Sport', 'Edge', 'Escape',
    'Expedition', 'Explorer', 'F-150', 'F-150 Lightning', 'F-250 Super Duty',
    'F-350 Super Duty', 'Maverick', 'Ranger', 'Transit', 'E-Transit',
  ],
  Chevrolet: [
    'Blazer', 'Blazer EV', 'Bolt EUV', 'Camaro', 'Corvette', 'Corvette E-Ray',
    'Corvette Z06', 'Corvette ZR1', 'Equinox', 'Equinox EV', 'Malibu',
    'Suburban', 'Tahoe', 'Trailblazer', 'Traverse', 'Trax', 'Colorado',
    'Silverado 1500', 'Silverado EV', 'Silverado 2500 HD', 'Silverado 3500 HD',
  ],
  GMC: [
    'Acadia', 'Canyon', 'Hummer EV Pickup', 'Hummer EV SUV', 'Savana Cargo',
    'Savana Passenger', 'Sierra 1500', 'Sierra EV', 'Sierra 2500 HD',
    'Sierra 3500 HD', 'Terrain', 'Yukon', 'Yukon XL',
  ],
  Ram: ['1500', '1500 REV', '1500 Ramcharger', '2500', '3500', 'ProMaster'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Hornet'],
  Jeep: [
    'Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Grand Cherokee 4xe',
    'Grand Wagoneer', 'Renegade', 'Wagoneer', 'Wagoneer S', 'Wrangler',
    'Wrangler 4xe',
  ],
  Mazda: [
    'Mazda3 Sedan', 'Mazda3 Hatchback', 'MX-5 Miata', 'CX-30', 'CX-5',
    'CX-50', 'CX-50 Hybrid', 'CX-70', 'CX-70 PHEV', 'CX-90', 'CX-90 PHEV',
  ],
  Subaru: [
    'Ascent', 'BRZ', 'Crosstrek', 'Crosstrek Hybrid', 'Forester',
    'Forester Hybrid', 'Impreza', 'Legacy', 'Outback', 'Solterra', 'WRX',
  ],
  Mitsubishi: ['Mirage', 'Outlander', 'Outlander PHEV', 'Outlander Sport', 'Eclipse Cross'],
  Hyundai: [
    'Accent', 'Elantra', 'Elantra Hybrid', 'Elantra N', 'Ioniq 5', 'Ioniq 6',
    'Kona', 'Kona Electric', 'Palisade', 'Santa Cruz', 'Santa Fe',
    'Santa Fe Hybrid', 'Sonata', 'Sonata Hybrid', 'Tucson', 'Tucson Hybrid',
    'Tucson PHEV', 'Venue',
  ],
  Kia: [
    'K4', 'K5', 'Carnival', 'EV6', 'EV9', 'Forte', 'Niro', 'Niro EV',
    'Niro PHEV', 'Seltos', 'Sorento', 'Sorento Hybrid', 'Sorento PHEV',
    'Soul', 'Sportage', 'Sportage Hybrid', 'Sportage PHEV', 'Stinger',
    'Telluride',
  ],
  BMW: [
    '2 Series', '2 Series Gran Coupe', '3 Series', '4 Series', '5 Series',
    '5 Series e', '7 Series', '8 Series', 'i4', 'i5', 'i7', 'iX', 'M2', 'M3',
    'M4', 'M5', 'M8', 'X1', 'X2', 'X3', 'X3 M', 'X4', 'X4 M', 'X5', 'X5 M',
    'X6', 'X6 M', 'X7', 'XM', 'Z4',
  ],
  'Mercedes-Benz': [
    'A-Class', 'C-Class', 'CLA', 'CLE', 'E-Class', 'S-Class', 'AMG GT', 'EQB',
    'EQE', 'EQS', 'EQS SUV', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS',
    'Maybach S-Class', 'SL',
  ],
  Audi: [
    'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'e-tron GT', 'Q3', 'Q4 e-tron', 'Q5',
    'Q6 e-tron', 'Q7', 'Q8', 'Q8 e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7',
    'R8', 'TT',
  ],
  Lexus: ['ES', 'IS', 'LS', 'RC', 'GX', 'LX', 'NX', 'RX', 'RX Hybrid', 'RZ', 'TX', 'UX'],
  Acura: ['Integra', 'TLX', 'ADX', 'MDX', 'MDX Type S', 'RDX', 'ZDX'],
  Infiniti: ['Q50', 'QX50', 'QX55', 'QX60', 'QX80'],
  Genesis: ['G70', 'G80', 'G90', 'Electrified G80', 'GV60', 'GV70', 'Electrified GV70', 'GV80', 'GV80 Coupe'],
  Volkswagen: ['Arteon', 'Atlas', 'Atlas Cross Sport', 'Golf', 'Golf GTI', 'Golf R', 'ID.4', 'Jetta', 'Jetta GLI', 'Passat', 'Taos', 'Tiguan'],
  Volvo: ['C40 Recharge', 'EX30', 'EX90', 'S60', 'S90', 'V60', 'V90', 'XC40', 'XC40 Recharge', 'XC60', 'XC90'],
  Porsche: ['718 Boxster', '718 Cayman', '911', 'Cayenne', 'Cayenne E-Hybrid', 'Macan', 'Macan EV', 'Panamera', 'Taycan'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  Cadillac: ['CT4', 'CT5', 'Escalade', 'Escalade ESV', 'XT4', 'XT5', 'XT6', 'Lyriq'],
  Lincoln: ['Aviator', 'Corsair', 'Nautilus', 'Navigator'],
  Buick: ['Enclave', 'Encore GX', 'Envision', 'Envista'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale'],
  Maserati: ['Ghibli', 'Levante', 'Quattroporte', 'GranTurismo', 'GranCabrio', 'MC20', 'Grecale'],
  Jaguar: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  Rivian: ['R1T', 'R1S'],
  Lucid: ['Air'],
  Polestar: ['Polestar 2', 'Polestar 3', 'Polestar 4'],
  Ferrari: ['296 GTB', '296 GTS', '812 Competizione', 'F8 Tributo', 'F8 Spider', 'Roma', 'Portofino M', 'SF90 Stradale', 'SF90 Spider', 'Purosangue'],
  Lamborghini: ['Huracán', 'Urus', 'Revuelto'],
  Bentley: ['Bentayga', 'Continental GT', 'Flying Spur'],
  'Rolls-Royce': ['Cullinan', 'Ghost', 'Phantom', 'Spectre'],
  McLaren: ['Artura', 'GT', '720S', '765LT'],
  'Aston Martin': ['DB11', 'DB12', 'DBS', 'DBX', 'Vantage'],
  Lotus: ['Eletre', 'Emira', 'Evija'],
  Mini: ['Cooper', 'Cooper Countryman', 'Cooper Clubman', 'Cooper SE Electric'],
  Fiat: ['500', '500X'],
  Chrysler: ['Pacifica', 'Pacifica Hybrid', '300'],
};

const defaultMotorBikeMakesAndModels = {
  BMW: ['S1000RR', 'S1000XR', 'R1300GS', 'R1300GS Adventure', 'R18', 'F900R', 'F900XR', 'F450GS', 'R1250RT', 'K1600GT', 'G310R', 'M1000RR'],
  KTM: ['1290 Super Duke R', '890 Duke R', '390 Duke', '890 Adventure', '1290 Super Adventure R', 'RC390', '450 Rally', '690 Enduro R'],
  TVS: ['Apache RTR 160', 'Ronin', 'iQube'],
  Hero: ['Xpulse 200', 'Karizma XMR', 'Splendor'],
  Zero: ['SR/F', 'SR/S', 'FXE', 'DSR/X', 'X'],
  Bajaj: ['Pulsar NS200', 'Dominar 400', 'Avenger'],
  Honda: ['CBR1000RR', 'CBR600RR', 'Africa Twin', 'Africa Twin Adventure Sports', 'Gold Wing', 'Gold Wing Tour', 'Rebel 500', 'Rebel 1100', 'CB500F', 'CB650R', 'CRF450R', 'CRF300L', 'NT1100', 'Forza 750', 'PCX150', 'ADV350', 'CRF1100L', 'Transalp'],
  Lotus: ['Eletre'],
  Vespa: ['Primavera', 'Sprint', 'GTS 300', 'GTS Super', 'Sei Giorni'],
  CFMoto: ['450CL-C', '800MT', '675NK', '300NK'],
  Ducati: ['Panigale V4', 'Monster', 'Multistrada V4', 'DesertX', 'XDiavel', 'Streetfighter V4', 'Scrambler', 'Diavel V4', 'Hypermotard', 'SuperSport 950'],
  Indian: ['Challenger', 'Chief', 'Scout', 'Roadmaster', 'Sport Chief', 'Chieftain', 'FTR'],
  Suzuki: ['GSX-R1000', 'GSX-R750', 'GSX-S750', 'Hayabusa', 'V-Strom 650', 'V-Strom 1050', 'SV650', 'DR650S', 'Katana', 'Boulevard M109R', 'GSX-8S', 'GSX-8R'],
  Yamaha: ['YZF-R1', 'YZF-R7', 'MT-09', 'MT-07', 'Tracer 9 GT', 'Tenere 700', 'XMAX 300', 'Super Tenere', 'YZF-R3', 'MT-03', 'R3', 'YZF-R6', 'Bolt', 'XSR900', 'Ténéré 700 Rally'],
  Aprilia: ['RSV4', 'RS660', 'Tuono 660', 'Tuareg 660', 'RS457', 'Tuono 457'],
  Benelli: ['Tornado 550', 'TRK 502', 'TRK 602', 'Leonino'],
  Piaggio: ['Liberty', 'MP3', 'Beverly'],
  Polaris: ['Slingshot'],
  Triumph: ['Speed Triple 1200', 'Bonneville T120', 'Tiger 900', 'Rocket 3', 'Street Twin', 'Speed Twin 900', 'Trident 660', 'Tiger 1200', 'Daytona 660'],
  Energica: ['Experia', 'Eva Ribelle'],
  Kawasaki: ['Ninja ZX-10R', 'Ninja ZX-6R', 'Ninja 400', 'Z900', 'Z650', 'Versys 650', 'Versys 1000', 'Vulcan 900', 'KLR650', 'KX450', 'KLE500', 'Ninja ZX-4RR', 'Z900RS'],
  Husqvarna: ['Norden 901', 'Vitpilen 401', 'Svartpilen 401', '701 Enduro', '701 Supermoto'],
  'MV Agusta': ['F3', 'Superveloce', 'Brutale', 'Dragster'],
  'Moto Guzzi': ['V7', 'V9', 'V100 Mandello', 'Stelvio'],
  'Royal Enfield': ['Meteor 350', 'Classic 350', 'Himalayan', 'Bear 650', 'Guerrilla 450', 'Continental GT 650', 'Interceptor 650', 'Super Meteor 650'],
  'Harley-Davidson': ['Street Glide', 'Road Glide', 'Sportster S', 'Pan America', 'Heritage Classic', 'Fat Boy', 'Breakout', 'Low Rider ST', 'CVO Road Glide', 'Nightster', 'Iron 883', 'Softail Standard'],
};

const defaultBicycleMakesAndModels = {
  Trek: ['Madone SLR', 'Domane SL', 'Emonda SLR', 'Fuel EX', 'Slash', 'Marlin 7', 'FX 3', 'Allant+', 'Verve 3', 'Rail 5', 'Top Fuel', 'Procaliber'],
  Specialized: ['Tarmac SL7', 'Roubaix', 'Diverge STR', 'Stumpjumper', 'Epic EVO', 'Turbo Levo', 'Rockhopper', 'Sirrus', 'Creo SL', 'Enduro', 'Chisel'],
  Giant: ['TCR Advanced', 'Defy Advanced', 'Contend AR', 'Anthem Advanced', 'Trance X', 'Reign Advanced', 'Talon', 'Escape 3', 'Contessa', 'Stance'],
  Cannondale: ['SuperSix Evo', 'Synapse', 'Topstone', 'Jekyll', 'Habit', 'Scalpel', 'CAAD Optimo', 'SystemSix', 'Moterra', 'Trail'],
  Scott: ['Addict RC', 'Foil RC', 'Spark RC', 'Genius', 'Aspect', 'Scale', 'Contessa Scale', 'Ransom', 'Voltage'],
  SantaCruz: ['Hightower', '5010', 'Tallboy', 'Bronson', 'Chameleon', 'Nomad', 'Megatower', 'Blur'],
  BMC: ['Teammachine', 'Roadmachine', 'Urs', 'Kaius', 'Fourstroke', 'Twostroke', 'Alpenchallenge'],
  Canyon: ['Ultimate', 'Aeroad', 'Grail', 'Spectral', 'Torque', 'Grand Canyon', 'Stoic', 'Pathlite'],
  Pinarello: ['Dogma F', 'Dogma FS', 'Prince', 'Gan', 'X9', 'Grax'],
  Cervelo: ['S5', 'R5', 'Áspero', 'Caledonia', 'Soloist', 'P5'],
  Bianchi: ['Oltre XR4', 'Aria', 'Specialissima', 'Impulso', 'Methan', 'Arcadex'],
  Orbea: ['Orca', 'Aqua', 'Alma', 'Occam', 'Rise', 'Wild', 'Gain'],
  Cube: ['Agree', 'Attain', 'Litening', 'Stereo', 'AMS', 'Reaction', 'Ella'],
  Merida: ['Reacto', 'Scultura', 'Big Nine', 'Big Trail', 'eSpresso', 'Crossway'],
  RockyMountain: ['Instinct', 'Growler', 'Pipeline', 'Altitude', 'Thunderbolt', 'Solo'],
  Yeti: ['SB140', 'SB130', 'SB165', 'ARC', '450', 'Bet'],
  Brompton: ['C Line', 'A Line', 'P Line', 'H Line', 'T Line', 'Electric'],
  Raleigh: ['Revenge', 'Cadent', 'Tamland', 'Redux', 'Rushhour'],
};

const getDefaultMakesAndModelsByType = (type) => {
  const normalized = String(type || '').toLowerCase();

  if (normalized === 'motorbike' || normalized === 'motorcycle') {
    return defaultMotorBikeMakesAndModels;
  }

  if (normalized === 'bike' || normalized === 'bicycle' || normalized === 'bicycles') {
    return defaultBicycleMakesAndModels;
  }

  return defaultVehicleMakesAndModels;
};

export const getVehicleMakesAndModels = async (type) => {
  const defaults = getDefaultMakesAndModelsByType(type);

  try {
    const res = await apiClient.get('/vehicle-makes-and-model');

    if (String(type || '').toLowerCase() === 'motorbike' || String(type || '').toLowerCase() === 'motorcycle') {
      return res?.data?.motorbikes ?? defaults;
    }

    if (String(type || '').toLowerCase() === 'bike' || String(type || '').toLowerCase() === 'bicycle' || String(type || '').toLowerCase() === 'bicycles') {
      return res?.data?.bikes ?? defaults;
    }

    return res?.data?.list ?? defaults;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return defaults;
  }
};

export const getAllowedVehicleYears = async () => {
  try {
    const res = await apiClient.get('/allowed-vehicle-year');
    const years = res?.data?.years ?? [];
    const cur = new Date().getFullYear();
    const sorted = [...years].sort((a, b) => parseInt(a) - parseInt(b));
    const last = parseInt(sorted[sorted.length - 1] ?? String(cur));

    if (last >= cur) return sorted;

    return [
      ...sorted,
      ...Array.from({ length: cur - last + 1 }, (_, i) => String(last + i + 1)),
    ];
  } catch {
    const cur = new Date().getFullYear();
    return Array.from({ length: cur - 2000 + 2 }, (_, i) => String(2000 + i));
  }
};