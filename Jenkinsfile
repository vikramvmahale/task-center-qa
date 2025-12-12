@Library('jenkins-library') _

pipeline
{
  agent any
  parameters {
    choice(name: 'DOCKER_SERVICE', 
           choices: ['fulltest', 'api', 'ui', 'functional', 'custom'], 
           description: 'Which test suite to run?')
    choice(name: 'TEST_ENVIRONMENT', 
           choices: ['test', 'dev', 'accp', 'prod'], 
           description: 'Which environment to target?')
    string(name: 'DOCKER_CUSTOM_CMD', 
           defaultValue: '', 
           description: 'Custom command (only if DOCKER_SERVICE = custom) example: npx playwright test tests/api/HealthApiTests.spec.ts')
  }
  triggers {
    cron('H 1 * * *')
  }
  stages
  {
    stage('Build preparations') {
      steps {
        script {
          gitCommitHash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
          shortCommitHash = gitCommitHash.take(7)
          // calculate a version tag
          VERSION = shortCommitHash
          // set the build display name
          currentBuild.displayName = "#${BUILD_ID}-${VERSION}"
          // Single test environment using mainline
          IMAGE_TAG = "${PROJECT}:main-${VERSION}"
          IMAGE_LATEST = "${PROJECT}:latest"
          TASKS_IMAGE_TAG = "${PROJECT}:tasks-latest"
          ENV = "main"
        }
      }
    }

    stage('Docker build') {
      steps {
        script {
          docker.build("${IMAGE_TAG}")
          // Tag the same image as latest
          sh("docker tag ${IMAGE_TAG} ${IMAGE_LATEST}")
          // Tag the same image as tasks-latest
          sh("docker tag ${IMAGE_TAG} ${TASKS_IMAGE_TAG}")
        }
      }
    }

    stage('Docker push') {
      steps {
        script {
          sh("aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR}")
          ECRURL = "http://${ECR}"
          echo ECRURL
          // Push the Docker images to ECR
          docker.withRegistry(ECRURL)
          {
            docker.image(IMAGE_TAG).push()
            docker.image(IMAGE_LATEST).push()
            docker.image(TASKS_IMAGE_TAG).push()
          }
          // Set full ECR paths for use in test stage
          FULL_IMAGE = "${ECR}${IMAGE_LATEST}"
          FULL_TASKS_IMAGE = "${ECR}${TASKS_IMAGE_TAG}"
          echo "Full image path: ${FULL_IMAGE}"
          echo "Full tasks image path: ${FULL_TASKS_IMAGE}"
        }
      }
    }

    stage('Run Tests and Upload Results') {
      steps {
        withCredentials([
          string(credentialsId: 'tcalc-qa-job-api-key', variable: 'API_KEY'),
          [$class: 'AmazonWebServicesCredentialsBinding',
           accessKeyVariable: 'AWS_ACCESS_KEY_ID',
           secretKeyVariable: 'AWS_SECRET_ACCESS_KEY',
           credentialsId: 'Jenkins-Dev']
        ]) {
          script {
            def testFailed = false
            try {
              // Use DOCKER_SERVICE parameter to specify which service to run
              def serviceToRun = params.DOCKER_SERVICE ?: 'fulltest'
              echo "Running Docker service: ${serviceToRun}"
              
              // Determine which command to run
              def testCommand = ''
              switch(serviceToRun) {
                case 'fulltest':
                  testCommand = 'npm run fullTest'
                  break
                case 'api':
                  testCommand = 'npm run api:test'
                  break
                case 'ui':
                  testCommand = 'npm run ui:test'
                  break
                case 'functional':
                  testCommand = 'npm run functional:test'
                  break
                case 'custom':
                  testCommand = params.DOCKER_CUSTOM_CMD ?: 'npm run fullTest'
                  break
                default:
                  echo "Unknown service: ${serviceToRun}, defaulting to fulltest"
                  testCommand = 'npm run fullTest'
              }
              
              // Get TEST_ENVIRONMENT parameter
              def testEnvironment = params.TEST_ENVIRONMENT ?: 'test'
              echo "Test environment: ${testEnvironment}"
              
              // Authenticate with ECR before pulling image (if not already authenticated)
              sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR}"
              
              // Run tests in Docker container with volumes mounted
              // Run as root to avoid permission issues with mounted volumes
              docker.image("${FULL_IMAGE}")
                .inside("-u root -v ${WORKSPACE}/test-results:/app/test-results -v ${WORKSPACE}/playwright-report:/app/playwright-report -e API_KEY=${API_KEY} -e TEST_ENVIRONMENT=${testEnvironment}")
                {
                  // Run tests (running as root, so no permission issues)
                  sh "cd /app && ${testCommand}"
                }
            } catch (Exception e) {
              testFailed = true
              echo "Tests failed, but will still upload results to S3"
              throw e
            } finally {
              // Upload test results to S3 after tests complete (even if tests failed)
              def timestamp = new Date().format('yyyyMMdd-HHmmss')
              def s3Path = "s3://${S3_BUCKET}/${timestamp}/"
              
              def reportZipUrl = ""
              
              sh """
                echo "Uploading test results to ${s3Path}"
                
                # Upload test-results directory if it exists
                if [ -d "test-results" ] && [ "\$(ls -A test-results)" ]; then
                  aws s3 sync test-results/ "${s3Path}test-results/" \\
                    --region ${AWS_REGION} \\
                    --delete \\
                    --exclude "*.tmp" \\
                    --exclude "*.log" || echo "Warning: Failed to upload test-results"
                fi
                
                # Zip and upload playwright-report if it exists
                if [ -d "playwright-report" ] && [ "\$(ls -A playwright-report)" ]; then
                  # Zip the playwright-report folder
                  zip -r playwright-report.zip playwright-report/ || echo "Warning: Failed to zip playwright-report"
                  
                  # Upload the zip file to S3
                  zipKey="${timestamp}/playwright-report.zip"
                  aws s3 cp playwright-report.zip "s3://${S3_BUCKET}/\${zipKey}" \\
                    --region ${AWS_REGION} || echo "Warning: Failed to upload playwright-report.zip"
                  
                  # Generate pre-signed URL for the zip file (valid for 7 days)
                  reportZipUrl=\$(aws s3 presign "s3://${S3_BUCKET}/\${zipKey}" \\
                    --region ${AWS_REGION} \\
                    --expires-in 604800) || echo "Warning: Failed to generate pre-signed URL"
                  
                  # Save URL to file for post section
                  echo "\${reportZipUrl}" > ${WORKSPACE}/report-zip-url.txt || echo "Warning: Failed to save URL"
                fi
                
                # Create summary file
                cat > /tmp/test-results-summary.json << EOSUMMARY
{
  "timestamp": "\$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "s3Path": "${s3Path}",
  "reportZipUrl": "\${reportZipUrl}"
}
EOSUMMARY
                
                aws s3 cp /tmp/test-results-summary.json "${s3Path}summary.json" \\
                  --region ${AWS_REGION} || echo "Warning: Failed to upload summary"
                
                echo "Test results uploaded successfully"
                if [ -n "\${reportZipUrl}" ]; then
                  echo "Report ZIP URL: \${reportZipUrl}"
                fi
              """
              
              // Read the pre-signed URL from file and send email via SES
              if (fileExists("${WORKSPACE}/report-zip-url.txt")) {
                reportZipUrl = readFile("${WORKSPACE}/report-zip-url.txt").trim()
                echo "Report ZIP URL captured: ${reportZipUrl}"
                
                // Determine email subject based on test result
                def emailStatus = testFailed ? "FAILED" : "SUCCESS"
                def emailSubject = "Task Center QA: Nightly Automated Test Execution"
                def emailBodyHtml = """<p>The Playwright test run completed${testFailed ? ' with failures' : ' successfully'}.</p>
<p><strong>Download the test report:</strong></p>
<p><a href="${reportZipUrl}">${reportZipUrl}</a></p>
<p><em>This link expires in 7 days.</em></p>
<p>Build: <a href="${env.BUILD_URL}">${env.JOB_NAME} #${env.BUILD_NUMBER}</a></p>"""
                
                // Create SES email message file with proper JSON escaping
                def stageRecipientList = [
                  'donna.vaughan@exprealty.net',
                  'steve.ybarra@exprealty.net',
                  'sherri.delbridge@exprealty.net',
                  'michael.auen@exprealty.net',
                  'connor.reid@exprealty.net',
                  'pratik.thorat@exprealty.net'
                ]
                def emailJson = [
                  Source: "noreply@exprealty.net",
                  Destination: [
                    ToAddresses: stageRecipientList
                  ],
                  Message: [
                    Subject: [
                      Data: emailSubject,
                      Charset: "UTF-8"
                    ],
                    Body: [
                      Html: [
                        Data: emailBodyHtml,
                        Charset: "UTF-8"
                      ]
                    ]
                  ]
                ]
                
                writeJSON file: "${WORKSPACE}/ses-email.json", json: emailJson
                
                // Send email via SES
                sh """
                  aws ses send-email \\
                    --region ${AWS_REGION} \\
                    --cli-input-json file://${WORKSPACE}/ses-email.json \\
                    || echo "Warning: Failed to send email via SES"
                """
              } else {
                echo "Warning: report-zip-url.txt file not found - no email sent"
              }
            }
          }
        }
      }
    }

    

  }
  environment {
    VERSION = 'latest'
    PROJECT = 'exp/task-center-qa'
    IMAGE = 'exp/task-center-qa:latest'
    TASKS_IMAGE = 'exp/task-center-qa:tasks-latest'
    ECR = '204048894727.dkr.ecr.us-east-1.amazonaws.com/'
    TF_VAR_app_image = '99'
    TF_VAR_tasks_image = '99'
    // S3 bucket for test results (optional - set to enable S3 upload)
    S3_BUCKET = 'exp-dev-task-center-qa-job-test-results'
    AWS_REGION = 'us-east-1'
    // Job pass/fail email addresses
    RECIPIENT_LIST = 'connor.reid@exprealty.net'
    ENV = 'main'
  }
  post {
    always {
      node('linux') {
        cleanWs()
        sh "docker rmi ${IMAGE_TAG} | true"
        sh "docker rmi ${IMAGE_LATEST} | true"
        sh "docker rmi ${TASKS_IMAGE_TAG} | true"
      }
    }
    success {
      script {
        CommonPostStepSuccess()
      }
    }
    failure {
      script {
        CommonPostStepFailure()
      }
    }
  }
  options {
    buildDiscarder(logRotator(numToKeepStr: '3'))
  }
}
