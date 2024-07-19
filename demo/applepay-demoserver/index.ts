import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Create a security group that allows HTTP and HTTPS traffic
const sg = new aws.ec2.SecurityGroup('payone-apple-pay-demo-server-sg', {
  name: 'payone-apple-pay-demo-server-sg',
  description: 'Allow HTTP and HTTPS traffic',
  ingress: [
    {
      protocol: 'tcp',
      fromPort: 80,
      toPort: 80,
      cidrBlocks: ['0.0.0.0/0'],
    },
    {
      protocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrBlocks: ['0.0.0.0/0'],
    },
  ],
  egress: [
    {
      protocol: '-1',
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ['0.0.0.0/0'],
      ipv6CidrBlocks: ['::/0'],
    },
  ],
});

// Create an EC2 instance
const server = new aws.ec2.Instance('payone-apple-pay-demo-server', {
  instanceType: 't2.micro',
  ami: 'ami-0346fd83e3383dcb4', // Amazon Linux 2023 AMI
  securityGroups: [sg.name],
  keyName: 'payone-apple-pay-demo-server-keypair',
  userData: pulumi.interpolate`#!/bin/bash
        # Update the package repository
        yum update -y

        # Install Node.js and Git
        curl -sL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs git unzip

        # Clone the project repository
        cd /home/ec2-user
        git clone https://github.com/PAYONE-GmbH/PCP-client-javascript-SDK.git express-app

        # Navigate to the app directory
        cd express-app

        # Checkout the develop branch
        git checkout develop

        # Navigate to the demo directory
        cd demo/applepay-demoserver

        # Install dependencies
        npm install

        # Start the server
        npm start &

        # Log output for debugging
        echo "Node.js and Git installed. Repository cloned, dependencies installed, and server started." > /home/ec2-user/setup.log
    `,
  tags: {
    Name: 'payone-apple-pay-demo-server',
  },
});

// Export the public IP and DNS of the instance
export const publicIp = server.publicIp;
export const publicDns = server.publicDns;
