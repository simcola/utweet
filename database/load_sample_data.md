# Loading Sample Data

## Step 1: Make sure schema is loaded
```bash
psql -U your_username -d utweet -f database/schema.sql
```

## Step 2: Load sample data
```bash
psql -U your_username -d utweet -f database/sample_data.sql
```

## Step 3: Verify data was loaded
```bash
psql -U your_username -d utweet -f database/check_data.sql
```

Or manually check:
```sql
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM regions;
```

## Troubleshooting

### If you see "0 items" after loading:
1. Check that categories were created in schema.sql:
   ```sql
   SELECT id, name, slug FROM categories;
   ```
   
2. The sample_data.sql uses category slugs to find IDs. If categories don't exist, items won't be inserted.

3. Check for errors when running sample_data.sql - it should show "INSERT 0 1" for each successful insert.

### If the API returns errors:
1. Check your `.env.local` file has the correct `DATABASE_URL`
2. Make sure PostgreSQL is running
3. Check the Next.js dev server console for database connection errors

