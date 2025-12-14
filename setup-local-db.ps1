# FILE: setup-local-db.ps1
Write-Host "Criando banco de dados D1 local..." -ForegroundColor Green
npx wrangler d1 create imperio_pizzas_db

Write-Host "Criando tabelas..." -ForegroundColor Green
npx wrangler d1 execute imperio_pizzas_db --local --file=./schema.sql

Write-Host "Inserindo categorias..." -ForegroundColor Green
npx wrangler d1 execute imperio_pizzas_db --local --command="INSERT INTO categories (id, name, slug, position) VALUES ('cat1', 'Pizzas Tradicionais', 'pizzas-tradicionais', 1), ('cat2', 'Pizzas Especiais', 'pizzas-especiais', 2), ('cat3', 'Bebidas', 'bebidas', 3);"

Write-Host "Inserindo produtos de exemplo..." -ForegroundColor Green
npx wrangler d1 execute imperio_pizzas_db --local --command="INSERT INTO products (id, category_id, name, slug, description, serves_people, base_price, active) VALUES ('p1', 'cat1', 'Pizza Margherita', 'pizza-margherita', 'Molho de tomate, mussarela, manjericão fresco e azeite', 2, 45.90, 1), ('p2', 'cat1', 'Pizza Calabresa', 'pizza-calabresa', 'Molho de tomate, mussarela, calabresa fatiada e cebola', 2, 48.90, 1), ('p3', 'cat2', 'Pizza Império Especial', 'pizza-imperio-especial', 'Molho de tomate, mussarela, peperoni, azeitonas pretas, pimentão e champignon', 3, 65.90, 1);"

Write-Host "Inserindo tamanhos..." -ForegroundColor Green
npx wrangler d1 execute imperio_pizzas_db --local --command="INSERT INTO product_sizes (id, product_id, name, price, position) VALUES ('s1', 'p1', 'Média', 45.90, 1), ('s2', 'p1', 'Grande', 58.90, 2), ('s3', 'p1', 'Família', 72.90, 3), ('s4', 'p2', 'Média', 48.90, 1), ('s5', 'p2', 'Grande', 61.90, 2), ('s6', 'p2', 'Família', 75.90, 3), ('s7', 'p3', 'Grande', 65.90, 1), ('s8', 'p3', 'Família', 85.90, 2);"

Write-Host "Inserindo sabores..." -ForegroundColor Green
npx wrangler d1 execute imperio_pizzas_db --local --command="INSERT INTO product_flavors (id, product_id, name, extra_price, position) VALUES ('f1', 'p3', 'Calabresa Premium', 0, 1), ('f2', 'p3', 'Frango Catupiry', 0, 2), ('f3', 'p3', 'Portuguesa', 0, 3);"

Write-Host "Inserindo adicionais..." -ForegroundColor Green
npx wrangler d1 execute imperio_pizzas_db --local --command="INSERT INTO product_addons (id, product_id, name, price, position) VALUES ('a1', 'p1', 'Borda recheada', 8.00, 1), ('a2', 'p1', 'Catupiry extra', 5.00, 2), ('a3', 'p2', 'Borda recheada', 8.00, 1), ('a4', 'p2', 'Catupiry extra', 5.00, 2), ('a5', 'p3', 'Borda recheada', 10.00, 1), ('a6', 'p3', 'Catupiry extra', 6.00, 2);"

Write-Host "Inserindo mesas..." -ForegroundColor Green
npx wrangler d1 execute imperio_pizzas_db --local --command="INSERT INTO tables (id, table_number, name, active) VALUES ('t1', 1, 'Mesa 1', 1), ('t2', 2, 'Mesa 2', 1), ('t3', 3, 'Mesa 3', 1), ('t4', 4, 'Mesa 4', 1), ('t5', 5, 'Mesa 5', 1), ('t6', 6, 'Mesa 6', 1), ('t7', 7, 'Mesa 7', 1), ('t8', 8, 'Mesa 8', 1), ('t9', 9, 'Mesa 9', 1), ('t10', 10, 'Mesa 10', 1);"

Write-Host "Configuração local completa!" -ForegroundColor Green
Write-Host "Execute 'npm run dev' para iniciar o servidor de desenvolvimento" -ForegroundColor Yellow