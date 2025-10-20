

const axios = require('axios');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors()); // Sử dụng CORS middleware
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // Cho phép xử lý JSON payload
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { log } = require('console');
const port = 3014;
const archiver = require('archiver');
const { S3Client, PutObjectCommand, ListObjectsV2Command, CreateBucketCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: 'https://h8f2.sg04.idrivee2-95.com',
    credentials: {
        accessKeyId: '8MpMlZcdipJtjGMQVj4F',
        secretAccessKey: 'NoVcyAoEy33dFbGEZT9PGeeJvq3yWSBa3wcTSE2X',
    },
    forcePathStyle: true, // idrive cần cái này
});


const apiKey = '4ab2789218e562d5eee1b5cc9c0a72f6';
const tokenX = 'ATTAe7cd4c745f63ae54df2577566a5bc194802e80367f2327bb9259058ba41232162FEC0C48';
const idModel = '686f3d6b18f82740b6cc65e8';
const url_list_hook_trello = `https://api.trello.com/1/tokens/${tokenX}/webhooks?key=${apiKey}&token=${tokenX}`;


// Kết nối đến Ngrok
async function startNgrok() {

    // Cấu hình các thông tin cần thiết cho request

    await axios.get(url_list_hook_trello)
        .then(response => {
            for (let k = 0; k < response.data.length; k++) {
                if (response.data[k].idModel == idModel) {
                    var urlhehe = `https://api.trello.com/1/webhooks/${response.data[k].id}?key=${apiKey}&token=${tokenX}`;
                    axios.delete(urlhehe)
                        .then(response => {
                            console.log('Webhook deleted successfully----*---*---*---*---*---*---*----');
                        })
                        .catch(error => {
                            console.error('Error deleting webhook:', error);
                        });
                }

            }

        })
        .catch(error => {
            console.error('Error making GET request:', error);
        });




    // var urlngrok = await ngrok.connect({
    //     addr: port,            // cổng Node.js app, ví dụ 3013
    //     web_addr: 'localhost:4050' // đổi web UI sang 4050
    // });

    // console.log(`ngrok tunnel created----*---*---*---*---*---*---*----`);



    //call toi trello de lien ket api
    const urlwebhooks = `https://api.trello.com/1/webhooks`;
    const params = {
        key: apiKey,
        token: tokenX,
        callbackURL: "http://103.238.70.219:" + port + "/webhook/trello",
        idModel: idModel,

    };
    await axios.post(urlwebhooks, params).then(response => {
        console.log('Webhook Created----*---*---*---*---*---*---*----');
    }).catch(error => {
        console.error('Error Creating Webhook:', error.response.data);
    });
}

startNgrok();
function processPath(path) {
    if (path.startsWith('\\\\\\')) {
        // Nếu đường dẫn bắt đầu bằng '\\\', chuyển thành '\\'
        return '\\\\' + path.slice(3);
    } else if (path.startsWith('\\\\')) {
        // Nếu đường dẫn bắt đầu bằng '\\', không làm gì
        return path;
    } else if (path.startsWith('\\')) {
        // Nếu đường dẫn bắt đầu bằng '\', thêm một '\' ở đầu
        return '\\' + path;
    } else {
        return path;
    }
}

// Thiết lập một endpoint để nhận webhook từ Trello
app.post('/webhook/trello', async (req, res) => {
    if (req.body.action.display.translationKey == "action_move_card_from_list_to_list") {
        if ((req.body.action.data.listBefore.id != idModel) && (req.body.action.data.listAfter.id == idModel)) {

            console.log("ACTIVE: ", req.body.action.data.card.name);

            const apiKey = 'eaab65cdb6b3f930891953f93327e65e';
            const apiToken = 'ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28';
            const cardId = req.body.action.data.card.id

            const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${apiToken}`;

            var stt = await axios.get(url)
                .then(response => {
                    const card = response.data;
                    // console.log(card);

                    var descrt = response.data.desc;
                    var sttCopy = response.data.labels.filter(itemx => itemx.name == "idrive");
                    return { descrt: descrt, sttCopy: (sttCopy.length > 0) ? true : false }


                })
                .catch(error => {
                    return { descrt: "false", sttCopy: true }

                });


            let url240 = (stt.descrt).replace(/\\_/g, '_');
            url240 = processPath(url240);


            let url230 = url240.replace('192.168.1.240\\in', '192.168.1.230\\file-to-us');


            async function checkDirectoryExists(directoryPath) {
                try {
                    await fsPromises.access(directoryPath, fsPromises.constants.F_OK);
                    return true;
                } catch (err) {

                    return false;
                }
            }
            async function deleteFilesInDirectory(directoryPath) {
                try {
                    const entries = await fsPromises.readdir(directoryPath, { withFileTypes: true });

                    for (let entry of entries) {
                        const filePath = path.join(directoryPath, entry.name);

                        if (entry.isFile()) {
                            await fsPromises.unlink(filePath);
                        }
                    }

                } catch (err) {
                    console.error('Lỗi khi xóa các tệp:');
                }
            }
            async function copyFolder(from, to) {
                try {
                    // Tạo thư mục đích nếu chưa tồn tại
                    await fsPromises.mkdir(to, { recursive: true });

                    // Đọc nội dung của thư mục nguồn
                    const entries = await fsPromises.readdir(from, { withFileTypes: true });

                    for (let entry of entries) {
                        const fromPath = path.join(from, entry.name);
                        const toPath = path.join(to, entry.name);

                        // Bỏ qua thư mục "file tool"
                        if (entry.name === 'file tool') {
                            continue;
                        }
                        if (entry.isDirectory()) {
                            // Nếu là thư mục, sao chép đệ quy
                            await copyFolder(fromPath, toPath);
                        } else {
                            // Nếu là tệp, sao chép tệp
                            await fsPromises.copyFile(fromPath, toPath);

                        }
                    }


                } catch (err) {
                    console.error(`Lỗi khi sao chép thư mục: ${err}`);
                }
            }
            async function uploadFolder(folderPath, bucketName, prefix = '') {
                const entries = await fsPromises.readdir(folderPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(folderPath, entry.name);
                    const key = path.join(prefix, entry.name).replace(/\\/g, '/');

                    if (entry.isDirectory()) {
                        await uploadFolder(fullPath, bucketName, key);
                    } else {
                        const fileStream = fs.createReadStream(fullPath);

                        const command = new PutObjectCommand({
                            Bucket: bucketName,
                            Key: key,
                            Body: fileStream,
                        });

                        await s3.send(command);

                    }
                }
            }

            async function uploadFolderToCustomShape(localFolderPath, bucketName, nameFolder, prefix = '') {
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execAsync = promisify(exec);

                const nameF = nameFolder.split("-").slice(4, 6).join('-'); // ex: across-back
                const s3Path = `${nameF}/${bucketName}/`;
                
                try {
                    // Sử dụng rclone để upload folder
                    const command = `rclone copy "${localFolderPath}" "idrivee2:custom-shape/${s3Path}" --exclude "file tool/**" --progress --transfers 4`;
                    
                    console.log(`🔄 Uploading with rclone: ${command}`);
                    const { stdout, stderr } = await execAsync(command);
                    
                    if (stderr && !stderr.includes('Transferred:')) {
                        console.error('rclone stderr:', stderr);
                    }
                    
                    console.log('✅ Upload completed with rclone');
                    return true;
                } catch (error) {
                    console.error('❌ rclone upload error:', error.message);
                    return false;
                }
            }

            async function ensureEmptyBucket(bucketName) {
                try {
                    const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
                    const listedObjects = await s3.send(listCommand);
                    if (!listedObjects.Contents || listedObjects.Contents.length === 0) return true;


                    const deleteParams = {
                        Bucket: bucketName,
                        Delete: {
                            Objects: listedObjects.Contents.map(({ Key }) => ({ Key }))
                        }
                    };

                    await s3.send(new DeleteObjectsCommand(deleteParams));

                    return true;
                } catch (err) {
                    console.error(`❌ Lỗi khi xoá file trong bucket '${bucketName}':`, err.message);
                    return false;
                }
            }


            async function createBucket(bucketName) {


                try {
                    const command = new CreateBucketCommand({ Bucket: bucketName });
                    await s3.send(command);

                    return true;
                } catch (err) {
                    if (err.name === 'BucketAlreadyOwnedByYou') {

                        try {
                            await ensureEmptyBucket(bucketName);

                            return true;
                        } catch (deleteErr) {
                            console.error('❌ Lỗi khi xoá/tạo lại:', deleteErr.message);
                            return false;
                        }
                    } else {
                        console.error('❌ Lỗi tạo bucket:', err.message);
                        return false;
                    }
                }
            }
            async function createOrResetFolder(bucketName, nameFolder) {
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execAsync = promisify(exec);

                const nameF = nameFolder.split("-").slice(4, 6).join('-'); // ex: across-back
                const s3Path = `${nameF}/${bucketName}/`;
                
                try {
                    // Sử dụng rclone để xóa folder cũ (nếu có)
                    const deleteCommand = `rclone purge "idrivee2:custom-shape/${s3Path}" --progress`;
                    console.log(`🧹 Cleaning folder: ${deleteCommand}`);
                    
                    try {
                        await execAsync(deleteCommand);
                        console.log(`✅ Cleaned folder: ${s3Path}`);
                    } catch (deleteError) {
                        // Folder có thể không tồn tại, không cần báo lỗi
                        console.log(`ℹ️  Folder ${s3Path} may not exist yet`);
                    }

                    return true;
                } catch (err) {
                    console.error('❌ Lỗi xử lý folder với rclone:', err.message);
                    return false;
                }
            }

            function generateBucketNameFromUNCPath(uncPath) {
                if (!uncPath || typeof uncPath !== 'string') return '';

                // Lấy phần cuối sau dấu \
                const parts = uncPath.split('\\').filter(Boolean);
                const folderName = parts[parts.length - 1];

                // Làm sạch: chữ thường, thay đặc biệt bằng -, gộp -, xóa đầu/cuối -
                let bucketName = folderName
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')    // thay đặc biệt bằng -
                    .replace(/-+/g, '-')            // gộp dấu -
                    .replace(/^-|-$/g, '');         // xóa đầu/cuối -

                bucketName = bucketName.length > 63 ? bucketName.slice(0, 63) : bucketName;
                bucketName = bucketName.replace(/^-+|-+$/g, ''); // xoá dấu - đầu/cuối
                return bucketName;
            }


            let sttUrl240 = await checkDirectoryExists(url240);
            let sttUrl230 = await checkDirectoryExists(url230);
            // console.log(url240, sttUrl240);
            // console.log(url230, sttUrl230);


            if (!stt.sttCopy) {// neu chua co nhan da copy
                if (sttUrl240) { // neu 240 ton tai thu muc

                    // if (sttUrl230) { // neu 230 ton tai thu muc
                    //     await deleteFilesInDirectory(url230);


                    // }

                    try {
                        // await copyFolder(url240, url230);

                        // axios.post(`https://api.trello.com/1/cards/${req.body.action.data.card.id}/idLabels`, {
                        //     value: "686f7071bf8196b83bb0d4b7",
                        //     key: 'eaab65cdb6b3f930891953f93327e65e',
                        //     token: "ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28"
                        // })

                        const parts = url240.split('\\').filter(Boolean);
                        const nameBucket = parts[parts.length - 1];

                        let SttCreateNameBucket = await createOrResetFolder(nameBucket, req.body.action.data.card.name); // thay tên nếu m
                        // console.log(" băt dau up load file");

                        if (SttCreateNameBucket)
                            try {
                                await uploadFolderToCustomShape(url240, nameBucket, req.body.action.data.card.name); // upload file vào thư mục đó trong custom-shape
                                var url2 = `https://api.trello.com/1/cards/${req.body.action.data.card.id}/actions/comments?key=eaab65cdb6b3f930891953f93327e65e&token=ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28`
                                axios.post(url2, { text: nameBucket }, {
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json'
                                    }
                                }).then(res => {

                                })
                                    .catch(err => {
                                        console.error("❌ Lỗi khi comment Trello:", err.message);
                                    });

                                axios.post(`https://api.trello.com/1/cards/${req.body.action.data.card.id}/idLabels`, {
                                    value: "687ccf0ab7f9d2b41034cb16",
                                    key: 'eaab65cdb6b3f930891953f93327e65e',
                                    token: "ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28"
                                }).then(res => {

                                })
                                    .catch(err => {
                                        console.error("❌ Lỗi khi card Trello:", err.message);
                                    });

                            } catch (error) {
                                axios.post(`https://api.trello.com/1/cards/${req.body.action.data.card.id}/idLabels`, {
                                    value: "6881b2fdb1c5355068bdfcee",
                                    key: 'eaab65cdb6b3f930891953f93327e65e',
                                    token: "ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28"
                                }).then(res => {

                                })
                                    .catch(err => {
                                        console.error("❌ Lỗi khi card Trello:", err.message);
                                    });
                            }






                    } catch (error) {
                        console.log("loi khi copy thu muc----:", error);
                    }

                }
                else {
                    axios.post(`https://api.trello.com/1/cards/${req.body.action.data.card.id}/idLabels`, {
                        value: "6881b290e8a9b169db061ec1",
                        key: 'eaab65cdb6b3f930891953f93327e65e',
                        token: "ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28"
                    }).then(res => {

                    })
                        .catch(err => {
                            console.error("❌ Lỗi khi card Trello:", err.message);
                        });

                }
            }
            // console.log(stt);
            console.log("-done-", req.body.action.data.card.name);
        }


    }


    // // Phản hồi lại Trello để biết rằng đã nhận được webhook
    res.status(200).send('Success 3011');
});



app.get('/webhook/trello', (req, res) => {  // để chạy api kích hoạt weebhook trello
    console.log('Webhook trello active/////////////////////////////////////////////');

    res.status(200).send('Success');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


