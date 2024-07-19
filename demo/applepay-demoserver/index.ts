import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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
});

// Create an EC2 instance
const server = new aws.ec2.Instance('payone-apple-pay-demo-server', {
  instanceType: 't2.micro',
  ami: 'ami-0346fd83e3383dcb4', // Amazon Linux 2023 AMI
  securityGroups: [sg.name],
  userData: `#!/bin/bash
        # Install Node.js
        curl -sL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs git

        # Clone the repository
        git clone https://github.com/PAYONE-GmbH/PCP-client-javascript-SDK.git /home/ec2-user/express-app

        # Navigate to the app directory
        cd /home/ec2-user/express-app/demo/applepay-demoserver

        # Install dependencies
        npm install

        # Start the server
        npm start &
    `,
  tags: {
    Name: 'payone-apple-pay-demo-server',
  },
});

// Export the public IP and DNS of the instance
export const publicIp = server.publicIp;
export const publicDns = server.publicDns;
