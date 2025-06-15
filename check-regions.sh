# 🌍 Quick Region Fix - Find and Connect the Right Resources

echo "🔍 Finding your Lambda function's actual region..."

# Check common regions for your Lambda function
FUNCTION_NAME="amplify-amplifyvitereacttemp-handlerlambdaE29D1580-QwPvrVmzjeqZ"

for region in us-east-1 us-west-2 eu-west-1 eu-central-1; do
    echo "Checking region: $region"
    if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$region" >/dev/null 2>&1; then
        echo "✅ Found Lambda function in region: $region"
        LAMBDA_REGION="$region"
        break
    fi
done

if [ -n "$LAMBDA_REGION" ]; then
    echo ""
    echo "🪣 Now finding S3 buckets in the same region ($LAMBDA_REGION)..."
    
    # List all buckets and check which ones are in the same region
    aws s3api list-buckets --query 'Buckets[].Name' --output text | tr '\t' '\n' | while read bucket; do
        if [[ "$bucket" == *"amplify"* ]]; then
            bucket_region=$(aws s3api get-bucket-location --bucket "$bucket" --output text 2>/dev/null)
            
            # Handle us-east-1 special case (returns "None")
            if [ "$bucket_region" = "None" ] || [ "$bucket_region" = "null" ]; then
                bucket_region="us-east-1"
            fi
            
            echo "Bucket: $bucket in region: $bucket_region"
            
            if [ "$bucket_region" = "$LAMBDA_REGION" ]; then
                echo "🎯 MATCH FOUND!"
                echo "Lambda: $FUNCTION_NAME in $LAMBDA_REGION"
                echo "Bucket: $bucket in $bucket_region"
                echo ""
                echo "🚀 Setting up S3 trigger now..."
                
                # Set up the trigger with matching resources
                LAMBDA_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$LAMBDA_REGION" --query 'Configuration.FunctionArn' --output text)
                
                aws lambda add-permission \
                  --function-name "$FUNCTION_NAME" \
                  --principal s3.amazonaws.com \
                  --action lambda:InvokeFunction \
                  --statement-id s3-trigger-permission-$(date +%s) \
                  --source-arn "arn:aws:s3:::$bucket" \
                  --region "$LAMBDA_REGION"
                
                aws s3api put-bucket-notification-configuration \
                  --bucket "$bucket" \
                  --region "$LAMBDA_REGION" \
                  --notification-configuration '{
                    "LambdaConfigurations": [{
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
                
                echo "✅ S3 trigger setup complete!"
                exit 0
            fi
        fi
    done
fi