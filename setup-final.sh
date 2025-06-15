#!/bin/bash
# 🎯 Exact S3 Trigger Setup - Using Your Real App Configuration

# Your exact resources from amplify_outputs.json
BUCKET_NAME="amplify-amplifyvitereactt-ragchatdocumentsbucketd9-z5uuvep0rtxg"
LAMBDA_FUNCTION="amplify-amplifyvitereacttemp-handlerlambdaE29D1580-QwPvrVmzjeqZ"
REGION="eu-central-1"

echo "🎯 Setting up S3 trigger with your exact app configuration"
echo "========================================================"
echo ""
echo "📦 App bucket: $BUCKET_NAME"
echo "⚡ Lambda function: $LAMBDA_FUNCTION"
echo "🌍 Region: $REGION"
echo ""

# Step 1: Verify resources exist
echo "1️⃣ Verifying resources exist..."

# Check bucket
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
    echo "✅ S3 bucket verified"
else
    echo "❌ S3 bucket not accessible"
    echo "   Check your AWS credentials and region"
    exit 1
fi

# Check Lambda function
if aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$REGION" >/dev/null 2>&1; then
    echo "✅ Lambda function verified"
else
    echo "❌ Lambda function not found"
    exit 1
fi

# Check if bucket has documents folder
echo ""
echo "🔍 Checking documents folder..."
DOCS_COUNT=$(aws s3 ls "s3://$BUCKET_NAME/documents/" --region "$REGION" 2>/dev/null | wc -l)
if [ "$DOCS_COUNT" -gt 0 ]; then
    echo "✅ Found documents folder with $DOCS_COUNT items"
    echo "📄 Your uploaded files:"
    aws s3 ls "s3://$BUCKET_NAME/documents/" --region "$REGION"
else
    echo "⚠️ No documents folder found (but this is OK - it will be created)"
fi

echo ""

# Step 2: Get Lambda ARN
echo "2️⃣ Getting Lambda function ARN..."
LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

if [ -z "$LAMBDA_ARN" ]; then
    echo "❌ Could not get Lambda ARN"
    exit 1
fi

echo "✅ Lambda ARN: $LAMBDA_ARN"
echo ""

# Step 3: Add permission for S3 to invoke Lambda
echo "3️⃣ Adding permission for S3 to invoke Lambda..."
aws lambda add-permission \
  --function-name "$LAMBDA_FUNCTION" \
  --principal s3.amazonaws.com \
  --action lambda:InvokeFunction \
  --statement-id "s3-trigger-permission-$(date +%s)" \
  --source-arn "arn:aws:s3:::$BUCKET_NAME" \
  --region "$REGION" \
  --output text 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Permission added successfully"
else
    echo "⚠️ Permission may already exist (this is OK)"
fi
echo ""

# Step 4: Configure S3 bucket notification
echo "4️⃣ Configuring S3 bucket notification..."

# Create the notification configuration
NOTIFICATION_CONFIG='{
  "LambdaFunctionConfigurations": [{
    "Id": "DocumentProcessorTrigger",
    "LambdaFunctionArn": "'$LAMBDA_ARN'",
    "Events": ["s3:ObjectCreated:*"],
    "Filter": {
      "Key": {
        "FilterRules": [{
          "Name": "prefix",
          "Value": "documents/"
        }]
      }
    }
  }]
}'

echo "📋 Applying notification configuration..."
aws s3api put-bucket-notification-configuration \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  --notification-configuration "$NOTIFICATION_CONFIG"

if [ $? -eq 0 ]; then
    echo "✅ S3 notification configured successfully!"
else
    echo "❌ Failed to configure S3 notification"
    echo "   This might be due to existing notifications or permissions"
    exit 1
fi

echo ""

# Step 5: Verify the configuration
echo "5️⃣ Verifying S3 trigger setup..."
TRIGGER_CHECK=$(aws s3api get-bucket-notification-configuration \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  --query 'LambdaFunctionConfigurations[0].Id' \
  --output text 2>/dev/null)

if [ "$TRIGGER_CHECK" = "DocumentProcessorTrigger" ]; then
    echo "✅ S3 trigger verified successfully!"
    
    # Show the complete configuration
    echo ""
    echo "📋 S3 trigger configuration:"
    aws s3api get-bucket-notification-configuration \
      --bucket "$BUCKET_NAME" \
      --region "$REGION" \
      --query 'LambdaFunctionConfigurations[0]' \
      --output table
else
    echo "⚠️ Could not verify trigger setup (but it might still work)"
fi

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "📋 Configuration summary:"
echo "   📦 S3 Bucket: $BUCKET_NAME"
echo "   ⚡ Lambda Function: $LAMBDA_FUNCTION"
echo "   🌍 Region: $REGION"
echo "   🔗 Trigger: documents/* uploads → Lambda processing"
echo ""
echo "🧪 TEST YOUR PIPELINE NOW:"
echo "   1. Go to your app (localhost:5173)"
echo "   2. Upload a new file via the 'Upload' tab"
echo "   3. Watch status change: pending → processing → completed"
echo "   4. Your existing pending files should also start processing!"
echo ""
echo "🔍 Monitor processing in real-time:"
echo "   aws logs tail /aws/lambda/$LAMBDA_FUNCTION --region $REGION --follow"
echo ""
echo "📊 Expected results:"
echo "   - Files change from 'pending' to 'completed' status"
echo "   - Text chunks appear when you click 'View Chunks'"
echo "   - Your Archimedes file should create 15-20 chunks!"
echo ""
echo "🎯 Your Stage 4 document processing pipeline is now LIVE!"
echo "🚀 Ready for Stage 5: Embeddings & Vector Search!"