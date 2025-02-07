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
('Rolls-Royce')
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
    ('Avalon')
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
    ('8 Series')
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
    ('Maybach S-Class')
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
    ('LC')
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
    ('Defender')
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
