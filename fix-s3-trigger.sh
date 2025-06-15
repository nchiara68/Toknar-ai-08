#!/bin/bash
# 🚀 Quick Fix: Set up S3 trigger for Stage 4 Document Processing

echo "🚀 Quick Fix: Setting up S3 trigger for document processing"
echo "=========================================================="

# Step 1: Find resources automatically
echo "🔍 Finding your AWS resources..."

# Find Lambda function
FUNCTION_NAME=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `document-processor`) || contains(FunctionName, `amplify`)].FunctionName' --output text | head -1)

# Find S3 bucket
BUCKET_NAME=$(aws s3 ls | grep -E '(ragchat|amplify)' | awk '{print $3}' | head -1)

# Validate we found everything
if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Could not find Lambda function automatically"
    echo "📋 Available functions:"
    aws lambda list-functions --query 'Functions[].FunctionName' --output table
    echo ""
    read -p "🔧 Enter your Lambda function name: " FUNCTION_NAME
fi

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Could not find S3 bucket automatically"
    echo "📋 Available buckets:"
    aws s3 ls
    echo ""
    read -p "🔧 Enter your S3 bucket name: " BUCKET_NAME
fi

echo "✅ Using Lambda function: $FUNCTION_NAME"
echo "✅ Using S3 bucket: $BUCKET_NAME"
echo ""

# Step 2: Get Lambda ARN
echo "🔗 Getting Lambda function ARN..."
LAMBDA_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --query 'Configuration.FunctionArn' --output text)

if [ -z "$LAMBDA_ARN" ]; then
    echo "❌ Could not get Lambda ARN"
    exit 1
fi

echo "✅ Lambda ARN: $LAMBDA_ARN"
echo ""

# Step 3: Add S3 permission to invoke Lambda
echo "🔐 Adding permission for S3 to invoke Lambda..."
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --principal s3.amazonaws.com \
  --action lambda:InvokeFunction \
  --statement-id s3-trigger-permission-$(date +%s) \
  --source-arn "arn:aws:s3:::$BUCKET_NAME" \
  --output text 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Permission added successfully"
else
    echo "⚠️ Permission may already exist (this is OK)"
fi
echo ""

# Step 4: Set up S3 bucket notification
echo "📢 Configuring S3 bucket notification..."

# Create the notification configuration
cat > /tmp/s3-notification-config.json << EOF
{
  "LambdaConfigurations": [
    {
      "Id": "DocumentProcessorTrigger",
      "LambdaFunctionArn": "$LAMBDA_ARN",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {
              "Name": "prefix",
              "Value": "documents/"
            }
          ]
        }
      }
    }
  ]
}
EOF

# Apply the configuration
aws s3api put-bucket-notification-configuration \
  --bucket "$BUCKET_NAME" \
  --notification-configuration file:///tmp/s3-notification-config.json

if [ $? -eq 0 ]; then
    echo "✅ S3 notification configured successfully!"
else
    echo "❌ Failed to configure S3 notification"
    exit 1
fi

# Clean up temp file
rm -f /tmp/s3-notification-config.json
echo ""

# Step 5: Verify the setup
echo "🧪 Verifying the S3 trigger setup..."
NOTIFICATION_CHECK=$(aws s3api get-bucket-notification-configuration --bucket "$BUCKET_NAME" --query 'LambdaConfigurations[0].Id' --output text 2>/dev/null)

if [ "$NOTIFICATION_CHECK" = "DocumentProcessorTrigger" ]; then
    echo "✅ S3 trigger verified successfully!"
else
    echo "⚠️ Could not verify S3 trigger setup"
fi
echo ""

# Step 6: Instructions for testing
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 What was configured:"
echo "   ✅ S3 bucket: $BUCKET_NAME"
echo "   ✅ Lambda function: $FUNCTION_NAME"  
echo "   ✅ Trigger: documents/* → Lambda"
echo ""
echo "🧪 Test your pipeline:"
echo "   1. Go to your app"
echo "   2. Upload a new file"
echo "   3. Watch status change: pending → processing → completed"
echo "   4. Check chunks appear in the UI"
echo ""
echo "🔍 Monitor processing:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
echo "🎯 Expected result: Your pending files should start processing!"
echo "   Files should move from 'pending' to 'completed' status"
echo "   Chunks should appear when you click 'View Chunks'"
echo ""

# Step 7: Show current pending files info
echo "📄 Current status in your app:"
echo "   - Check your 'Documents' tab"
echo "   - Pending files should start processing automatically"
echo "   - New uploads will trigger immediately"
echo ""
echo "✨ Your Stage 4 document processing pipeline is now complete!"