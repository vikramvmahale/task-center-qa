@Library('jenkins-library') _

pipeline
{
  agent any
  stages
  {
    stage('Build preparations') {
      steps {
        script {
          gitCommitHash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
          shortCommitHash = gitCommitHash.take(7)
          // calculate a sample version tag
          VERSION = shortCommitHash
          // set the build display name
          currentBuild.displayName = "#${BUILD_ID}-${VERSION}"
          // Single test environment using mainline
          IMAGE = "$PROJECT:main-$VERSION"
          TASKS_IMAGE = "$PROJECT:main-latest"
          ENV = "main"
        }
      }
    }

    stage('Docker build') {
      steps {
        script {
          docker.build("$IMAGE")
          // Tag the same image as branch-latest for tasks
          sh("docker tag $IMAGE $TASKS_IMAGE")
        }
      }
    }

    stage('Docker push') {
      steps {
        script {
          sh("aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ECR}")
          ECRURL = "http://${ECR}"
          echo ECRURL
          // Push the Docker image to ECR
          docker.withRegistry(ECRURL)
          {
            docker.image(IMAGE).push()
            docker.image(TASKS_IMAGE).push()
          }
          echo TF_VAR_app_image
          echo TF_VAR_tasks_image
          TF_VAR_app_image = "${ECR}${IMAGE}"
          TF_VAR_tasks_image = "${ECR}${TASKS_IMAGE}"
          echo TF_VAR_app_image
          echo TF_VAR_tasks_image
        }
      }
    }

  }
  environment {
    VERSION = 'latest'
    PROJECT = 'exp/automation-tests'
    IMAGE = 'exp/automation-tests:latest'
    TASKS_IMAGE = 'exp/automation-tests-tasks:latest'
    ECR = '204048894727.dkr.ecr.us-east-1.amazonaws.com/'
    TF_VAR_app_image = '99'
    TF_VAR_tasks_image = '99'
    // Job pass/fail email addresses
    RECIPIENT_LIST = 'donna.vaughan@exprealty.net, sherri.delbridge@exprealty.net, joseph.saenz@exprealty.net, steve.ybarra@exprealty.net, michael.auen@exprealty.net, rosetta.powell@exprealty.net'
    ENV = 'main'
  }
  post {
    always {
      node('linux') {
        cleanWs()
        sh "docker rmi $IMAGE | true"
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
