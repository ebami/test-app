#!/bin/bash

# Azure Deployment Script for Socket.io Chat App
# This script provisions Azure resources and sets up the deployment

set -e

# Configuration - Update these values
RESOURCE_GROUP="socket-chat-rg"
LOCATION="eastus"
APP_NAME="socketchat"  # Base name for resources

echo "🚀 Socket.io Chat App - Azure Deployment Script"
echo "================================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo "📋 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "🔐 Please login to Azure..."
    az login
fi

# Display current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "✅ Using subscription: $SUBSCRIPTION"

# Create Resource Group
echo ""
echo "📦 Creating Resource Group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
echo "✅ Resource Group created"

# Deploy ARM template
echo ""
echo "🏗️  Deploying Azure resources..."
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file ./infrastructure/arm-template.json \
    --parameters appName=$APP_NAME clientUrl="https://placeholder.azurestaticapps.net" \
    --query 'properties.outputs' \
    --output json)

# Extract outputs
BACKEND_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.backendUrl.value')
STATIC_WEB_APP_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.staticWebAppUrl.value')
BACKEND_APP_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.backendAppName.value')
STATIC_WEB_APP_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.staticWebAppName.value')

echo "✅ Resources deployed successfully!"
echo ""
echo "📍 Resource URLs:"
echo "   Backend API: $BACKEND_URL"
echo "   Frontend: $STATIC_WEB_APP_URL"

# Get Static Web App deployment token
echo ""
echo "🔑 Getting Static Web App deployment token..."
SWA_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query 'properties.apiKey' \
    --output tsv)

# Update backend CORS with actual Static Web App URL
echo ""
echo "🔧 Updating backend CORS settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --settings CLIENT_URL=$STATIC_WEB_APP_URL \
    --output none
echo "✅ CORS settings updated"

# Create service principal for GitHub Actions
echo ""
echo "🔐 Creating service principal for CI/CD..."
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name "${APP_NAME}-github-actions" \
    --role contributor \
    --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP \
    --sdk-auth)

echo ""
echo "=============================================="
echo "🎉 Deployment Complete!"
echo "=============================================="
echo ""
echo "📝 GitHub Secrets to configure:"
echo ""
echo "1. AZURE_CREDENTIALS:"
echo "$SP_OUTPUT"
echo ""
echo "2. AZURE_STATIC_WEB_APPS_API_TOKEN:"
echo "$SWA_TOKEN"
echo ""
echo "3. AZURE_RESOURCE_GROUP:"
echo "$RESOURCE_GROUP"
echo ""
echo "4. REACT_APP_SOCKET_URL:"
echo "$BACKEND_URL"
echo ""
echo "5. CLIENT_URL:"
echo "$STATIC_WEB_APP_URL"
echo ""
echo "=============================================="
echo "📚 Next Steps:"
echo "1. Add the above secrets to your GitHub repository"
echo "2. Push code to the 'main' branch to trigger deployment"
echo "3. Backend: $BACKEND_URL/api/health"
echo "4. Frontend: $STATIC_WEB_APP_URL"
echo "=============================================="
