# FILE: DEPLOYMENT.md
# Guia de Deployment - Império Pizzas

## 1. Configuração Inicial do Cloudflare

### 1.1 Criar D1 Database
```bash
wrangler d1 create imperio_pizzas_db
```

Copie o `database_id` retornado e atualize em `wrangler.toml`.

### 1.2 Executar Schema SQL
```bash
wrangler d1 execute imperio_pizzas_db --file=schema.sql
```

### 1.3 Criar R2 Bucket
```bash
wrangler r2 bucket create imperio-pizzas-media
```

## 2. Popular Dados Iniciais

### 2.1 Criar Categorias
```bash
wrangler d1 execute imperio_pizzas_db --command="
INSERT INTO categories (id, name, slug, position) VALUES 
('cat1', 'Pizzas Tradicionais', 'pizzas-tradicionais', 1),
('cat2', 'Pizzas Especiais', 'pizzas-especiais', 2),
('cat3', 'Bebidas', 'bebidas', 3);
"
```

### 2.2 Criar Mesas
```bash
wrangler d1 execute imperio_pizzas_db --command="
INSERT INTO tables (id, table_number, name, active) VALUES 
('t1', 1, 'Mesa 1', 1),
('t2', 2, 'Mesa 2', 1),
('t3', 3, 'Mesa 3', 1),
('t4', 4, 'Mesa 4', 1),
('t5', 5, 'Mesa 5', 1),
('t6', 6, 'Mesa 6', 1),
('t7', 7, 'Mesa 7', 1),
('t8', 8, 'Mesa 8', 1),
('t9', 9, 'Mesa 9', 1),
('t10', 10, 'Mesa 10', 1);
"
```

### 2.3 Criar Produtos de Exemplo
```bash
wrangler d1 execute imperio_pizzas_db --command="
INSERT INTO products (id, category_id, name, slug, description, serves_people, base_price, active) VALUES 
('p1', 'cat1', 'Pizza Margherita', 'pizza-margherita', 'Molho de tomate, mussarela, manjericão fresco e azeite', 2, 45.90, 1),
('p2', 'cat1', 'Pizza Calabresa', 'pizza-calabresa', 'Molho de tomate, mussarela, calabresa fatiada e cebola', 2, 48.90, 1),
('p3', 'cat2', 'Pizza Império Especial', 'pizza-imperio-especial', 'Molho de tomate, mussarela, peperoni, azeitonas pretas, pimentão e champignon', 3, 65.90, 1);
"
```

### 2.4 Criar Tamanhos
```bash
wrangler d1 execute imperio_pizzas_db --command="
INSERT INTO product_sizes (id, product_id, name, price, position) VALUES 
('s1', 'p1', 'Média', 45.90, 1),
('s2', 'p1', 'Grande', 58.90, 2),
('s3', 'p1', 'Família', 72.90, 3);
"
```

## 3. Configurar Variáveis de Ambiente

Edite `wrangler.toml` e configure:
```toml
[vars]
ADMIN_SECRET = "seu-secret-key-aqui"
WHATSAPP_PHONE = "5511999999999"  # Seu número WhatsApp com código do país
```

## 4. Build e Deploy

### 4.1 Instalar Dependências
```bash
npm install
```

### 4.2 Build Local
```bash
npm run build
```

### 4.3 Deploy para Cloudflare Pages
```bash
npm run deploy
```

Ou via Cloudflare Dashboard:
1. Conecte seu repositório Git ao Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Adicione bindings no Pages:
   - D1 Database: `DB` → `imperio_pizzas_db`
   - R2 Bucket: `MEDIA` → `imperio-pizzas-media`
4. Adicione environment variables:
   - `ADMIN_SECRET`
   - `WHATSAPP_PHONE`

## 5. Upload de Mídia para R2

Para fazer upload de imagens e vídeos 360° para R2:
```bash
wrangler r2 object put imperio-pizzas-media/products/pizza-margherita.jpg --file=./local-image.jpg
wrangler r2 object put imperio-pizzas-media/products/pizza-margherita-360.mp4 --file=./local-video.mp4
```

Então atualize a URL do produto:
```bash
wrangler d1 execute imperio_pizzas_db --command="
UPDATE products SET 
  image_url = 'https://seu-r2-domain.com/products/pizza-margherita.jpg',
  video_360_url = 'https://seu-r2-domain.com/products/pizza-margherita-360.mp4'
WHERE id = 'p1';
"
```

## 6. Configurar Domínio Personalizado

1. No Cloudflare Pages dashboard, vá em "Custom domains"
2. Adicione seu domínio (ex: imperiapizzas.com.br)
3. Configure DNS conforme instruções

## 7. URLs de Acesso

- **Site principal**: https://seu-dominio.com
- **Mesa 1**: https://seu-dominio.com/m1
- **Mesa 2**: https://seu-dominio.com/m2
- **Mesa N**: https://seu-dominio.com/mN

## 8. Monitoramento

- Logs: `wrangler pages deployment tail`
- Analytics: Cloudflare Dashboard > Pages > Analytics
- D1 Queries: Cloudflare Dashboard > D1 > Metrics

## 9. Performance

O projeto é otimizado para:
- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lazy loading de imagens e vídeos
- Edge caching via Cloudflare