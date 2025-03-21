const express = require('express'),
path = require('path'),
multer = require('multer'),
app = express(),
fs  = require("fs"),
{createCanvas, loadImage } = require("canvas");

const Folder = './uploads/';
const number_defaul = 12345;

function get_number(){
	var number = false;
	if(Number(fs.readFileSync('./count.txt')) == ''){
		number = number_defaul;
	}else{
		number = Number(fs.readFileSync('./count.txt'));
	}
	fs.writeFile("./count.txt", String(number + 1), function(error){});
    return number;
}

const imageFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb('Please upload only images.', false);
	}
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(__dirname, './uploads'));
	},
	filename: (req, file, cb) => {
		cb(null, `load_${Date.now()}${path.extname(file.originalname)}`);
	}
});

const upload = multer({storage: storage, fileFilter: imageFilter });

app.use('/upload', upload.array('files'), (req, res) => {
	var number = get_number();
	new Promise((resolve, reject) => {
		fs.readdir(Folder, (err, files) => {
			var i = 0;
			files.forEach(async file => {
				var flag = file.split("_")[0];
				if(flag == 'load'){
					fs.rename(Folder + file, Folder + `${number}_${++i}${path.extname(file)}`, function(err) {});
				}
			});
			resolve();
		});
	}).then(
		result => 
			setTimeout(function(){
				fs.readdir(Folder, (err, files) => {
					files.forEach(async file => {
						if(file.split("_")[0] && file.split("_")[1]){
							const
							sText = `Артикул: ${file.split("_")[0]}`;
							loadImage(Folder + file).then(img => {
								const canvas = createCanvas(img.width, img.height),
										ctx = canvas.getContext("2d");
								ctx.drawImage(img, 0, 0);
								ctx.font = '40px';
								ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
								ctx.lineWidth = 2;
								ctx.strokeStyle = "rgb(255, 0, 0)";
								
								let td = ctx.measureText(sText),
									tw = td.width,
									th = td.actualBoundingBoxAscent + td.actualBoundingBoxDescent;
								sX = 80, sY = 80;
								ctx.strokeText(sText, sX, sY);
								ctx.fillText(sText, sX, sY);
								const out = fs.createWriteStream(Folder + file),
										stream = canvas.createPNGStream();
								stream.pipe(out);
								out.on("finish", () => console.log("Done"));
							});
						}
					});
			}, 50000)
			
		}),
	)
   res.send('ok');
});

app.get('/', function (req, res) {
    var html = `<form action="/upload" method="post" enctype="multipart/form-data" >
            <p>Изображения:
                <input type="file" multiple="multiple" name="files" accept="image/*"/>
                <input type="submit" value="Отправить" />
            </p>
        </form>`;
  res.send(html)
})

app.listen(3000)