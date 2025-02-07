-- Add car brands if they don't exist
INSERT INTO brands (name) VALUES
('Toyota'),
('Honda'),
('Nissan'),
('Lexus'),
('BMW'),
('Mercedes-Benz'),
('Audi'),
('Volkswagen'),
('Porsche'),
('Ford'),
('Chevrolet'),
('Dodge'),
('Jeep'),
('Hyundai'),
('Kia'),
('Genesis'),
('Land Rover'),
('Jaguar'),
('Volvo'),
('Ferrari'),
('Lamborghini'),
('Maserati'),
('Alfa Romeo'),
('Tesla'),
('Mazda'),
('Subaru'),
('Infiniti'),
('Acura'),
('Bentley'),
('Rolls-Royce'),
('GMC'),
('Cadillac'),
('Mitsubishi'),
('Isuzu'),
('Haval'),
('Changan'),
('MG'),
('Geely'),
('Chery'),
('GAC'),
('Hongqi'),
('Lincoln'),
('RAM'),
('BAIC'),
('BYD'),
('JAC'),
('Great Wall Motors'),
('Foton'),
('Jetour'),
('Exeed'),
('Tank'),
('Bestune'),
('FAW'),
('Forthing'),
('Dongfeng'),
('Maxus'),
('Wuling')
ON CONFLICT (name) DO NOTHING;

-- Add car models for each brand
-- Toyota Models
WITH brand_toyota AS (SELECT id FROM brands WHERE name = 'Toyota')
INSERT INTO models (name, brand_id)
SELECT m.name, bt.id
FROM (VALUES
    ('Camry'),
    ('Corolla'),
    ('RAV4'),
    ('Land Cruiser'),
    ('Highlander'),
    ('4Runner'),
    ('Tundra'),
    ('Tacoma'),
    ('Prius'),
    ('Avalon'),
    ('Fortuner'),
    ('Innova'),
    ('Rush'),
    ('Yaris'),
    ('Crown'),
    ('FJ Cruiser'),
    ('Sequoia'),
    ('Granvia'),
    ('Hiace'),
    ('Hilux'),
    ('Land Cruiser GXR'),
    ('Land Cruiser VXR'),
    ('Land Cruiser GR Sport'),
    ('Land Cruiser 70 Series'),
    ('Corolla Cross'),
    ('Camry SE'),
    ('Camry Grande'),
    ('RAV4 Adventure'),
    ('Prado VXL'),
    ('Prado TXL'),
    ('Supra'),
    ('Land Cruiser GR Sport ZX'),
    ('Land Cruiser VXR Black Pack'),
    ('Prado VXL Adventure'),
    ('FJ Cruiser Final Edition'),
    ('Camry S-Sport'),
    ('RAV4 Adventure Plus')
) AS m(name)
CROSS JOIN brand_toyota bt
ON CONFLICT (name, brand_id) DO NOTHING;

-- Honda Models
WITH brand_honda AS (SELECT id FROM brands WHERE name = 'Honda')
INSERT INTO models (name, brand_id)
SELECT m.name, bh.id
FROM (VALUES
    ('Civic'),
    ('Accord'),
    ('CR-V'),
    ('Pilot'),
    ('HR-V'),
    ('Odyssey'),
    ('Ridgeline'),
    ('Passport'),
    ('Insight'),
    ('Fit')
) AS m(name)
CROSS JOIN brand_honda bh
ON CONFLICT (name, brand_id) DO NOTHING;

-- BMW Models
WITH brand_bmw AS (SELECT id FROM brands WHERE name = 'BMW')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('3 Series'),
    ('5 Series'),
    ('7 Series'),
    ('X1'),
    ('X3'),
    ('X5'),
    ('X7'),
    ('M3'),
    ('M5'),
    ('i4'),
    ('iX'),
    ('M8'),
    ('Z4'),
    ('4 Series'),
    ('8 Series'),
    ('X6 M'),
    ('X7 M60i'),
    ('M760i'),
    ('M8 Gran Coupe'),
    ('XM'),
    ('iX M60'),
    ('M4 CSL')
) AS m(name)
CROSS JOIN brand_bmw b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Mercedes-Benz Models
WITH brand_mercedes AS (SELECT id FROM brands WHERE name = 'Mercedes-Benz')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('A-Class'),
    ('C-Class'),
    ('E-Class'),
    ('S-Class'),
    ('GLA'),
    ('GLC'),
    ('GLE'),
    ('GLS'),
    ('AMG GT'),
    ('EQS'),
    ('CLA'),
    ('CLS'),
    ('G-Class'),
    ('GLB'),
    ('Maybach S-Class'),
    ('G 63 AMG'),
    ('G 500'),
    ('GLE 53 AMG'),
    ('GLS 600 Maybach'),
    ('S 580 Maybach'),
    ('S 680 Maybach'),
    ('AMG GT 63'),
    ('V-Class')
) AS m(name)
CROSS JOIN brand_mercedes b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Audi Models
WITH brand_audi AS (SELECT id FROM brands WHERE name = 'Audi')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('A3'),
    ('A4'),
    ('A6'),
    ('A8'),
    ('Q3'),
    ('Q5'),
    ('Q7'),
    ('Q8'),
    ('e-tron'),
    ('RS6'),
    ('RS7'),
    ('S4'),
    ('S5'),
    ('TT'),
    ('R8')
) AS m(name)
CROSS JOIN brand_audi b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Lexus Models
WITH brand_lexus AS (SELECT id FROM brands WHERE name = 'Lexus')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('ES'),
    ('IS'),
    ('LS'),
    ('NX'),
    ('RX'),
    ('UX'),
    ('GX'),
    ('LX'),
    ('RC'),
    ('LC'),
    ('LX 600'),
    ('LX 570'),
    ('GX 460'),
    ('RX 350'),
    ('ES 350'),
    ('IS 350'),
    ('LS 500'),
    ('LX 600 F Sport'),
    ('LX 600 VIP'),
    ('GX 550'),
    ('RX 500h F Sport'),
    ('IS 500 F Sport'),
    ('LC 500 Convertible'),
    ('LX 600 Ultra Luxury'),
    ('RX 350h'),
    ('RX 500h Luxury'),
    ('GX 550 Luxury'),
    ('GX 550 Overtrail'),
    ('IS 350 F Sport')
) AS m(name)
CROSS JOIN brand_lexus b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Tesla Models
WITH brand_tesla AS (SELECT id FROM brands WHERE name = 'Tesla')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Model 3'),
    ('Model Y'),
    ('Model S'),
    ('Model X'),
    ('Cybertruck')
) AS m(name)
CROSS JOIN brand_tesla b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Porsche Models
WITH brand_porsche AS (SELECT id FROM brands WHERE name = 'Porsche')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('911'),
    ('Cayenne'),
    ('Macan'),
    ('Panamera'),
    ('Taycan'),
    ('718 Cayman'),
    ('718 Boxster')
) AS m(name)
CROSS JOIN brand_porsche b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Land Rover Models
WITH brand_lr AS (SELECT id FROM brands WHERE name = 'Land Rover')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Range Rover'),
    ('Range Rover Sport'),
    ('Range Rover Velar'),
    ('Range Rover Evoque'),
    ('Discovery'),
    ('Discovery Sport'),
    ('Defender'),
    ('Range Rover SV'),
    ('Range Rover Autobiography'),
    ('Range Rover Sport SVR'),
    ('Defender 90'),
    ('Defender 110'),
    ('Defender 130'),
    ('Discovery Metropolitan')
) AS m(name)
CROSS JOIN brand_lr b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Rolls-Royce Models
WITH brand_rr AS (SELECT id FROM brands WHERE name = 'Rolls-Royce')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Phantom'),
    ('Ghost'),
    ('Cullinan'),
    ('Wraith'),
    ('Dawn')
) AS m(name)
CROSS JOIN brand_rr b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Bentley Models
WITH brand_bentley AS (SELECT id FROM brands WHERE name = 'Bentley')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Continental GT'),
    ('Flying Spur'),
    ('Bentayga'),
    ('Mulsanne')
) AS m(name)
CROSS JOIN brand_bentley b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Ferrari Models
WITH brand_ferrari AS (SELECT id FROM brands WHERE name = 'Ferrari')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('F8 Tributo'),
    ('SF90 Stradale'),
    ('Roma'),
    ('Portofino'),
    ('812 Superfast'),
    ('296 GTB')
) AS m(name)
CROSS JOIN brand_ferrari b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Lamborghini Models
WITH brand_lambo AS (SELECT id FROM brands WHERE name = 'Lamborghini')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Urus'),
    ('Huracán'),
    ('Aventador'),
    ('Countach'),
    ('Revuelto')
) AS m(name)
CROSS JOIN brand_lambo b
ON CONFLICT (name, brand_id) DO NOTHING;

-- GMC Models (Very popular in GCC)
WITH brand_gmc AS (SELECT id FROM brands WHERE name = 'GMC')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Yukon'),
    ('Yukon XL'),
    ('Sierra'),
    ('Acadia'),
    ('Terrain'),
    ('Denali'),
    ('AT4'),
    ('Canyon'),
    ('Yukon Denali Ultimate'),
    ('Yukon AT4-X'),
    ('Sierra Denali Ultimate'),
    ('Sierra AT4X'),
    ('Acadia Denali'),
    ('Terrain AT4')
) AS m(name)
CROSS JOIN brand_gmc b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Cadillac Models (Luxury segment in GCC)
WITH brand_cadillac AS (SELECT id FROM brands WHERE name = 'Cadillac')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Escalade'),
    ('CT4'),
    ('CT5'),
    ('XT4'),
    ('XT5'),
    ('XT6'),
    ('LYRIQ')
) AS m(name)
CROSS JOIN brand_cadillac b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Mitsubishi Models (Popular in Middle East)
WITH brand_mitsubishi AS (SELECT id FROM brands WHERE name = 'Mitsubishi')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Pajero'),
    ('Montero Sport'),
    ('L200'),
    ('Outlander'),
    ('ASX'),
    ('Eclipse Cross'),
    ('Attrage'),
    ('Xpander')
) AS m(name)
CROSS JOIN brand_mitsubishi b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Haval Models (Growing Chinese brand in GCC)
WITH brand_haval AS (SELECT id FROM brands WHERE name = 'Haval')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('H6'),
    ('Jolion'),
    ('H9'),
    ('Big Dog'),
    ('Dargo'),
    ('H2')
) AS m(name)
CROSS JOIN brand_haval b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Changan Models (Popular Chinese brand)
WITH brand_changan AS (SELECT id FROM brands WHERE name = 'Changan')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('CS35 Plus'),
    ('CS75 Plus'),
    ('CS85'),
    ('CS95'),
    ('Eado'),
    ('Alsvin')
) AS m(name)
CROSS JOIN brand_changan b
ON CONFLICT (name, brand_id) DO NOTHING;

-- MG Models (Growing brand in Middle East)
WITH brand_mg AS (SELECT id FROM brands WHERE name = 'MG')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('HS'),
    ('ZS'),
    ('RX5'),
    ('RX8'),
    ('GT'),
    ('5'),
    ('6'),
    ('Cyberster')
) AS m(name)
CROSS JOIN brand_mg b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Geely Models
WITH brand_geely AS (SELECT id FROM brands WHERE name = 'Geely')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Coolray'),
    ('Azkarra'),
    ('Okavango'),
    ('Tugella'),
    ('GC9')
) AS m(name)
CROSS JOIN brand_geely b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Chery Models
WITH brand_chery AS (SELECT id FROM brands WHERE name = 'Chery')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Tiggo 7 Pro'),
    ('Tiggo 8 Pro'),
    ('Tiggo 4 Pro'),
    ('Arrizo 6'),
    ('Tiggo 2')
) AS m(name)
CROSS JOIN brand_chery b
ON CONFLICT (name, brand_id) DO NOTHING;

-- GAC Models
WITH brand_gac AS (SELECT id FROM brands WHERE name = 'GAC')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('GS8'),
    ('GS3'),
    ('GS4'),
    ('GS5'),
    ('GN8'),
    ('GA4')
) AS m(name)
CROSS JOIN brand_gac b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Nissan Models
WITH brand_nissan AS (SELECT id FROM brands WHERE name = 'Nissan')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Patrol'),
    ('Patrol Safari'),
    ('Patrol NISMO'),
    ('X-Terra'),
    ('Sunny'),
    ('Kicks'),
    ('X-Trail'),
    ('Altima'),
    ('Maxima'),
    ('Pathfinder'),
    ('Navara'),
    ('Patrol Platinum'),
    ('Patrol V6'),
    ('Patrol LE'),
    ('Patrol Super Safari'),
    ('Patrol Desert Edition'),
    ('Patrol Nismo 2023'),
    ('Urvan'),
    ('Z'),
    ('Patrol Platinum City'),
    ('Patrol Black Edition'),
    ('X-Terra Midnight'),
    ('Altima Midnight'),
    ('Z Performance'),
    ('Z Proto Spec')
) AS m(name)
CROSS JOIN brand_nissan b
ON CONFLICT (name, brand_id) DO NOTHING;

-- BYD Models (Growing EV brand)
WITH brand_byd AS (SELECT id FROM brands WHERE name = 'BYD')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('ATTO 3'),
    ('HAN'),
    ('TANG'),
    ('SEAL'),
    ('DOLPHIN'),
    ('SONG PLUS')
) AS m(name)
CROSS JOIN brand_byd b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Jetour Models (Growing Chinese brand in GCC)
WITH brand_jetour AS (SELECT id FROM brands WHERE name = 'Jetour')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('X70'),
    ('X90'),
    ('X95'),
    ('Dashing'),
    ('X70 Plus')
) AS m(name)
CROSS JOIN brand_jetour b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Tank Models (Luxury Chinese SUV brand)
WITH brand_tank AS (SELECT id FROM brands WHERE name = 'Tank')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('300'),
    ('500'),
    ('700'),
    ('800')
) AS m(name)
CROSS JOIN brand_tank b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Exeed Models (Premium Chinese brand)
WITH brand_exeed AS (SELECT id FROM brands WHERE name = 'Exeed')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('TXL'),
    ('VX'),
    ('LX'),
    ('RX')
) AS m(name)
CROSS JOIN brand_exeed b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Great Wall Motors Models
WITH brand_gwm AS (SELECT id FROM brands WHERE name = 'Great Wall Motors')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Poer'),
    ('Cannon'),
    ('Tank 300'),
    ('Ora'),
    ('Wey')
) AS m(name)
CROSS JOIN brand_gwm b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Infiniti Models (Popular in GCC)
WITH brand_infiniti AS (SELECT id FROM brands WHERE name = 'Infiniti')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('QX80'),
    ('QX60'),
    ('QX50'),
    ('QX55'),
    ('Q50'),
    ('Q60')
) AS m(name)
CROSS JOIN brand_infiniti b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Hongqi Models (Growing luxury brand in Qatar)
WITH brand_hongqi AS (SELECT id FROM brands WHERE name = 'Hongqi')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('H9'),
    ('E-HS9'),
    ('H5'),
    ('HS5'),
    ('E-QM5')
) AS m(name)
CROSS JOIN brand_hongqi b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Maxus Models (Growing in Qatar)
WITH brand_maxus AS (SELECT id FROM brands WHERE name = 'Maxus')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('D90'),
    ('T90'),
    ('D60'),
    ('G50'),
    ('G20'),
    ('V80'),
    ('MIFA 9')
) AS m(name)
CROSS JOIN brand_maxus b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Forthing Models (New in Qatar market)
WITH brand_forthing AS (SELECT id FROM brands WHERE name = 'Forthing')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('T5 EVO'),
    ('U-Tour'),
    ('T5L'),
    ('Thunder'),
    ('Dragon')
) AS m(name)
CROSS JOIN brand_forthing b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Dongfeng Models (Growing in Qatar)
WITH brand_dongfeng AS (SELECT id FROM brands WHERE name = 'Dongfeng')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('IX5'),
    ('E70'),
    ('AX7'),
    ('T5 EVO'),
    ('M-Hero')
) AS m(name)
CROSS JOIN brand_dongfeng b
ON CONFLICT (name, brand_id) DO NOTHING;

-- Wuling Models (New in Qatar)
WITH brand_wuling AS (SELECT id FROM brands WHERE name = 'Wuling')
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Almaz RS'),
    ('Air EV'),
    ('Cortez'),
    ('Formo Max'),
    ('Victory')
) AS m(name)
CROSS JOIN brand_wuling b
ON CONFLICT (name, brand_id) DO NOTHING;
