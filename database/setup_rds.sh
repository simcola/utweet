#!/bin/bash
# Script to set up database schema and sample data on AWS RDS
# Usage: ./setup_rds.sh <RDS_ENDPOINT> <DB_NAME> <USERNAME>

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <RDS_ENDPOINT> <DB_NAME> <USERNAME>"
    echo "Example: $0 utweet-db.xxxxx.us-east-1.rds.amazonaws.com utweet utweet_admin"
    exit 1
fi

RDS_ENDPOINT=$1
DB_NAME=$2
USERNAME=$3

echo "Setting up database on RDS..."
echo "Endpoint: $RDS_ENDPOINT"
echo "Database: $DB_NAME"
echo "Username: $USERNAME"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "Error: psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# Load schema
echo "Loading schema..."
psql -h "$RDS_ENDPOINT" -U "$USERNAME" -d "$DB_NAME" -f database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema loaded successfully"
else
    echo "❌ Failed to load schema"
    exit 1
fi

# Ask if user wants to load sample data
read -p "Do you want to load sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Loading sample data..."
    psql -h "$RDS_ENDPOINT" -U "$USERNAME" -d "$DB_NAME" -f database/sample_data.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Sample data loaded successfully"
    else
        echo "❌ Failed to load sample data"
        exit 1
    fi
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your DATABASE_URL environment variable:"
echo "   postgresql://$USERNAME:your_password@$RDS_ENDPOINT:5432/$DB_NAME"
echo "2. Configure your application with the DATABASE_URL"
echo "3. Test the connection"



