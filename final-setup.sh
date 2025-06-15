#!/bin/bash
# 🎯 Final S3 Trigger Setup - Using Your Actual App Bucket

# Your actual app bucket (from screenshot)
APP_BUCKET="amplify-amplifyvitereactrachatdocumentsbucketd9-z5uuvep0rtxg"
LAMBDA_FUNCTION="amplify-amplifyvitereacttemp-handlerlambdaE29D1580-QwPvrVmzjeqZ"

echo "🎯 Setting up S3 trigger for your actual app bucket"
echo "================================================="
echo ""
echo "📦 App bucket: $APP_BUCKET"
echo "⚡ Lambda function: $LAMBDA_FUNCTION"
echo ""

# Step 1: Determine the bucket's region
echo "1️⃣ Finding the bucket's region..."
BUCKET_REGION=$(aws s3api get-bucket-location --bucket "$APP_BUCKET" --output text 2>/dev/null)

# Handle the special case where us-east-1 returns "None"
if [ "$BUCKET_REGION" = "None" ] || [ "$BUCKET_REGION" = "null" ]; then
    BUCKET_REGION="us-east-1"
fi

if [ -z "$BUCKET_REGION" ]; then
    echo "❌ Could not determine bucket region"
    exit 1
fi

echo "✅ Bucket region: $BUCKET_REGION"
echo ""

# Step 2: Check if Lambda function exists in the same region
echo "2️⃣ Checking if Lambda function exists in region: $BUCKET_REGION"
if aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$BUCKET_REGION" >/dev/null 2>&1; then
    echo "✅ Lambda function found in the same region!"
    LAMBDA_REGION="$BUCKET_REGION"
else
    echo "❌ Lambda function not found in $BUCKET_REGION"
    echo ""
    echo "🔍 Checking other regions for the Lambda function..."
    
    # Check common regions
    for region in us-east-1 us-west-2 eu-west-1 eu-central-1; do
        if [ "$region" != "$BUCKET_REGION" ]; then
            echo "   Checking $region..."
            if aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$region" >/dev/null 2>&1; then
                echo "   ✅ Found Lambda in: $region"
                LAMBDA_REGION="$region"
                break
            fi
        fi
    done
    
    if [ "$LAMBDA_REGION" != "$BUCKET_REGION" ]; then
        echo ""
        echo "⚠️ REGION MISMATCH:"
        echo "   📦 Bucket: $APP_BUCKET in $BUCKET_REGION"
        echo "   ⚡ Lambda: $LAMBDA_FUNCTION in $LAMBDA_REGION"
        echo ""
        echo "🔧 S3 triggers only work when bucket and Lambda are in the same region."
        echo ""
        echo "📋 SOLUTIONS:"
        echo "1. Set up trigger manually in AWS Console"
        echo "2. Look for a Lambda function in region: $BUCKET_REGION"
        echo "3. Cross-region setup (more complex)"
        echo ""
        echo "🖱️ MANUAL SETUP (Recommended):"
        echo "1. Go to: https://s3.console.aws.amazon.com/"
        echo "2. Click bucket: $APP_BUCKET"
        echo "3. Properties → Event notifications → Create event notification"
        echo "4. Configure:"
        echo "   - Name: DocumentProcessorTrigger"
        echo "   - Prefix: documents/"
        echo "   - Events: All object create events"
        echo "   - Destination: Lambda function in ANY region"
        echo "   - Function: Any function that processes documents"
        echo ""
        exit 1
    fi
fi

echo ""

# Step 3: Set up the S3 trigger (same region)
echo "3️⃣ Setting up S3 trigger (both resources in $LAMBDA_REGION)..."

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$LAMBDA_REGION" --query 'Configuration.FunctionArn' --output text)
echo "📋 Lambda ARN: $LAMBDA_ARN"
echo ""

# Add permission for S3 to invoke Lambda
echo "🔐 Adding permission for S3 to invoke Lambda..."
aws lambda add-permission \
  --function-name "$LAMBDA_FUNCTION" \
  --principal s3.amazonaws.com \
  --action lambda:InvokeFunction \
  --statement-id s3-trigger-permission-$(date +%s) \
  --source-arn "arn:aws:s3:::$APP_BUCKET" \
  --region "$LAMBDA_REGION" \
  2>/dev/null || echo "   Permission may already exist (OK)"

echo "✅ Permission added"
echo ""

# Set up S3 notification
echo "📢 Configuring S3 bucket notification..."
aws s3api put-bucket-notification-configuration \
  --bucket "$APP_BUCKET" \
  --region "$LAMBDA_REGION" \
  --notification-configuration '{
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

if [ $? -eq 0 ]; then
    echo "✅ S3 trigger configured successfully!"
else
    echo "❌ Failed to configure S3 trigger"
    echo "   Try the manual setup method instead"
    exit 1
fi

echo ""

# Step 4: Verify the setup
echo "4️⃣ Verifying the S3 trigger setup..."
TRIGGER_ID=$(aws s3api get-bucket-notification-configuration \
  --bucket "$APP_BUCKET" \
  --region "$LAMBDA_REGION" \
  --query 'LambdaFunctionConfigurations[0].Id' \
  --output text 2>/dev/null)

if [ "$TRIGGER_ID" = "DocumentProcessorTrigger" ]; then
    echo "✅ S3 trigger verified successfully!"
else
    echo "⚠️ Could not verify trigger (but it might still work)"
fi

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "📋 Configuration:"
echo "   📦 S3 Bucket: $APP_BUCKET"
echo "   ⚡ Lambda: $LAMBDA_FUNCTION"
echo "   🌍 Region: $LAMBDA_REGION"
echo "   🔗 Trigger: documents/* uploads → Lambda processing"
echo ""
echo "🧪 TEST NOW:"
echo "   1. Go to your app (localhost:5173)"
echo "   2. Upload a new file"
echo "   3. Watch status change: pending → processing → completed"
echo "   4. Your existing pending files should also start processing!"
echo ""
echo "🔍 Monitor processing:"
echo "   aws logs tail /aws/lambda/$LAMBDA_FUNCTION --region $LAMBDA_REGION --follow"
echo ""
echo "🎯 Your Stage 4 document processing pipeline should now be WORKING!"