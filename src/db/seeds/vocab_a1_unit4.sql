-- Seed: A1 Unit 4 - Food & Drink
-- This is the first main unit after onboarding

INSERT INTO vocab_items (spanish, english, phonetic, part_of_speech, level, unit, category, sequence_order, example_sentence_es, example_sentence_en, gender)
VALUES
-- Meals
('desayuno', 'breakfast', 'deh-sah-YOO-noh', 'noun', 'A1', 4, 'food', 1, 'Quiero desayuno.', 'I want breakfast.', 'masculine'),
('almuerzo', 'lunch', 'ahl-MWER-soh', 'noun', 'A1', 4, 'food', 2, 'El almuerzo está listo.', 'Lunch is ready.', 'masculine'),
('cena', 'dinner', 'SEH-nah', 'noun', 'A1', 4, 'food', 3, 'La cena es a las ocho.', 'Dinner is at eight.', 'feminine'),

-- Common Foods
('pollo', 'chicken', 'POH-yoh', 'noun', 'A1', 4, 'food', 4, 'Quiero pollo asado.', 'I want roasted chicken.', 'masculine'),
('arroz', 'rice', 'ah-ROHS', 'noun', 'A1', 4, 'food', 5, 'Pollo con arroz.', 'Chicken with rice.', 'masculine'),
('carne', 'meat', 'KAR-neh', 'noun', 'A1', 4, 'food', 6, 'No como carne.', 'I don''t eat meat.', 'feminine'),
('pescado', 'fish', 'pehs-KAH-doh', 'noun', 'A1', 4, 'food', 7, 'El pescado está fresco.', 'The fish is fresh.', 'masculine'),
('huevos', 'eggs', 'WEH-vohs', 'noun', 'A1', 4, 'food', 8, 'Huevos revueltos.', 'Scrambled eggs.', 'masculine'),
('pan', 'bread', 'PAHN', 'noun', 'A1', 4, 'food', 9, 'Pan con mantequilla.', 'Bread with butter.', 'masculine'),
('ensalada', 'salad', 'ehn-sah-LAH-dah', 'noun', 'A1', 4, 'food', 10, 'Una ensalada grande.', 'A big salad.', 'feminine'),

-- Drinks
('agua', 'water', 'AH-gwah', 'noun', 'A1', 4, 'drinks', 11, 'Un vaso de agua, por favor.', 'A glass of water, please.', 'feminine'),
('café', 'coffee', 'kah-FEH', 'noun', 'A1', 4, 'drinks', 12, 'Quiero un café.', 'I want a coffee.', 'masculine'),
('cerveza', 'beer', 'sehr-VEH-sah', 'noun', 'A1', 4, 'drinks', 13, 'Dos cervezas, por favor.', 'Two beers, please.', 'feminine'),
('vino', 'wine', 'VEE-noh', 'noun', 'A1', 4, 'drinks', 14, 'Un vino tinto.', 'A red wine.', 'masculine'),
('jugo', 'juice', 'HOO-goh', 'noun', 'A1', 4, 'drinks', 15, 'Jugo de naranja.', 'Orange juice.', 'masculine'),

-- Tener expressions
('tengo hambre', 'I am hungry', 'TEHN-goh AHM-breh', 'phrase', 'A1', 4, 'expressions', 16, 'Tengo mucha hambre.', 'I am very hungry.', NULL),
('tengo sed', 'I am thirsty', 'TEHN-goh SEHD', 'phrase', 'A1', 4, 'expressions', 17, 'Tengo sed, quiero agua.', 'I am thirsty, I want water.', NULL),

-- Querer + noun
('quiero', 'I want', 'KYEH-roh', 'verb', 'A1', 4, 'verbs', 18, 'Quiero más comida.', 'I want more food.', NULL),
('quieres', 'you want', 'KYEH-rehs', 'verb', 'A1', 4, 'verbs', 19, '¿Qué quieres comer?', 'What do you want to eat?', NULL),

-- Restaurant vocabulary
('la cuenta', 'the check/bill', 'lah KWEHN-tah', 'noun', 'A1', 4, 'restaurant', 20, 'La cuenta, por favor.', 'The check, please.', 'feminine'),
('mesa', 'table', 'MEH-sah', 'noun', 'A1', 4, 'restaurant', 21, 'Una mesa para dos.', 'A table for two.', 'feminine'),
('menú', 'menu', 'meh-NOO', 'noun', 'A1', 4, 'restaurant', 22, '¿Me trae el menú?', 'Can you bring me the menu?', 'masculine'),
('propina', 'tip', 'proh-PEE-nah', 'noun', 'A1', 4, 'restaurant', 23, 'Dejé una buena propina.', 'I left a good tip.', 'feminine'),
('delicioso', 'delicious', 'deh-lee-SYOH-soh', 'adjective', 'A1', 4, 'food', 24, '¡Está delicioso!', 'It''s delicious!', NULL),
('rico', 'tasty, delicious', 'REE-koh', 'adjective', 'A1', 4, 'food', 25, '¡Qué rico!', 'How tasty!', NULL);
