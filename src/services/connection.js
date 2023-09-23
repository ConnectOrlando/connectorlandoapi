{
  ('IsEncrypted');
  false, 'Values';
  {
    ('AzureWebJobsStorage');
    'DefaultEndpointsProtocol=https;AccountName=uploadimagesample1;AccountKey=rDQAfJJp20EGiOUIhm2DDV8PLo5Dl0+fHtfxOUuS/w1kCw59QbbNBh7oOwdHK9mkZHxBiMXeXrtB+AStb2jdsQ==;EndpointSuffix=core.windows.net',
      'FUNCTIONS_WORKER_RUNTIME';
    ('node');
  }
}

// import {
//   StorageSharedKeyCredential,
//   ContainerSASPermissions,
//   generateBlobSASQueryParameters,
// } from '@azure/storage-blob';

// export default async function (context) {
//   const permissions = 'c';
//   const container = 'images';
//   context.res = {
//     body: generateSasToken(
//       //process.env.AzureWebJobsStorage,
//       container,
//       permissions
//     ),
//   };
//   context.done();
// }

// //function generateSasToken(connectionString, container, permissions) {
//   const { accountKey, accountName, url } =
//     extractConnectionStringParts(connectionString);
//   const sharedKeyCredential = new StorageSharedKeyCredential(
//     accountName,
//     accountKey.toString('base64')
//   );

//   var expiryDate = new Date();
//   expiryDate.setHours(expiryDate.getHours() + 2);

//   const sasKey = generateBlobSASQueryParameters(
//     {
//       containerName: container,
//       permissions: ContainerSASPermissions.parse(permissions),
//       expiresOn: expiryDate,
//     },
//     sharedKeyCredential
//   );
//   return {
//     sasKey: sasKey.toString(),
//     url: url,
//   };
// }
