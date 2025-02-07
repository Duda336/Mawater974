-- Add car brands
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
('Rolls-Royce');

-- Add car models for each brand
-- Toyota Models
INSERT INTO models (name, brand_id) 
SELECT m.name, b.id
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
CROSS JOIN brands b
WHERE b.name = 'Toyota';

-- Honda Models
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
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
CROSS JOIN brands b
WHERE b.name = 'Honda';

-- BMW Models
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
CROSS JOIN brands b
WHERE b.name = 'BMW';

-- Mercedes-Benz Models
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
CROSS JOIN brands b
WHERE b.name = 'Mercedes-Benz';

-- Audi Models
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
CROSS JOIN brands b
WHERE b.name = 'Audi';

-- Lexus Models
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
CROSS JOIN brands b
WHERE b.name = 'Lexus';

-- Tesla Models
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Model 3'),
    ('Model Y'),
    ('Model S'),
    ('Model X'),
    ('Cybertruck')
) AS m(name)
CROSS JOIN brands b
WHERE b.name = 'Tesla';

-- Porsche Models
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
CROSS JOIN brands b
WHERE b.name = 'Porsche';

-- Land Rover Models
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
CROSS JOIN brands b
WHERE b.name = 'Land Rover';

-- Rolls-Royce Models
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Phantom'),
    ('Ghost'),
    ('Cullinan'),
    ('Wraith'),
    ('Dawn')
) AS m(name)
CROSS JOIN brands b
WHERE b.name = 'Rolls-Royce';

-- Bentley Models
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Continental GT'),
    ('Flying Spur'),
    ('Bentayga'),
    ('Mulsanne')
) AS m(name)
CROSS JOIN brands b
WHERE b.name = 'Bentley';

-- Ferrari Models
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
CROSS JOIN brands b
WHERE b.name = 'Ferrari';

-- Lamborghini Models
INSERT INTO models (name, brand_id)
SELECT m.name, b.id
FROM (VALUES
    ('Urus'),
    ('Huracán'),
    ('Aventador'),
    ('Countach'),
    ('Revuelto')
) AS m(name)
CROSS JOIN brands b
WHERE b.name = 'Lamborghini';
