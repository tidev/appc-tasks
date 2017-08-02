#! groovy
library 'pipeline-library'

def publishableBranches = ['master']

node('node && npm && npm-publish && nsp && retirejs') {
  stage('Checkout') {
    checkout scm
    packageVersion = jsonParse(readFile('package.json'))['version']
    currentBuild.displayName = "#${packageVersion}-${currentBuild.number}"
  }
  stage('Dependencies') {
    sh 'npm install'
  }
  stage('Security') {
    sh 'retire'
    sh 'nsp check'
  }
  stage('Test') {
    sh 'npm test'
  }
  stage('Publish') {
    if(publishableBranches.contains(env.BRANCH_NAME)) {
      echo "Publishing ${env.BRANCH_NAME} branch as version ${packageVersion}."
      sh 'npm publish'
      pushGitTag(name: "v${packageVersion}", force: true)
    }
  }
}
