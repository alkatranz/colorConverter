document.addEventListener("DOMContentLoaded", ()=>{
	//podgląd koloru
	const colorView = document.querySelector("#colorView");
	const viewText = document.querySelector("#colorView>p");
	//canvas z odcieniami wybranego koloru
	const colorPaletteCanvas = document.querySelector("#colorPalette");
	//canvas z kolorowym gradientem
	const colorBarCanvas = document.getElementById("colorBar");
	const colorBarCanvasContext = colorBarCanvas.getContext('2d');
	//tablice z inputami kolorów
	const rgbInputs = document.querySelectorAll("#rgb input");
	const cmykInputs = document.querySelectorAll("#cmyk input");
	const hsvInputs = document.querySelectorAll("#hsv input");
	const hexInputs = document.querySelectorAll("#hex input");
	//tablice z kolorami w wybranych notacjach. Wykorzystanie niżej
	let rgbColors = [];
	let cmykColors = [];
	let hsvColors = [];
	let hexColors = [];

	let dragPallete = false; //zmienna potrzebna do eventa "mousemove" w wybieraniu koloru z 'colorPalette'
	let changeReason = ""; //powod zmiany koloru (canvas, rgb, cmyk, hsv) do inputFiller
	//początkowa wartość tła
	colorView.style.backgroundColor="rgb(255,255,255)";
	//rysowanie palety kolorów na canvasie
	function drawCanvas(H){
		for(let y = 0; y <= colorPaletteCanvas.height; y++){
			for(let x = 0; x <= colorPaletteCanvas.width; x++){
				const S = x/255;
				const V = y/255;
				const C = V * S;
				const X = C * (1 - Math.abs(((H / 60) % 2)-1));
				const m = V - C;
					let rp = C;
					let gp = X;
					let bp = 0;
				
				if(H >= 60 && H < 120){
					rp = X;
					gp = C;
					bp = 0;
				}
				else if (H >= 120 && H < 180){
					rp = 0;
					gp = C;
					bp = X;
				}
				else if (H >= 180 && H < 240){
					rp = 0;
					gp = X;
					bp = C;
				}
				else if (H >= 240 && H < 300){
					rp = X;
					gp = 0;
					bp = C;
				}
				else if (H >=300 && H < 360){
					rp = C;
					gp = 0;
					bp = X;
				}
				const r=(rp + m) * 255;
				const g=(gp + m) * 255;
				const b=(bp + m) * 255;
				colorPaletteCanvas.getContext('2d').fillStyle = `rgb(${r}, ${g}, ${b})`;
				colorPaletteCanvas.getContext('2d').fillRect(x, colorPaletteCanvas.height - y, 1, 1);
			}	
		}
	}
	//pobranie koloru z canvasu
	function getColor(e, canvas, isCodeRequired){
		codeRequired = isCodeRequired;
		const canvasSize = canvas.getBoundingClientRect();
		const cursorPos = {
			x: e.clientX - canvasSize.left,
			y: e.clientY - canvasSize.top,
		}
		const pickedColor = canvas.getContext('2d').getImageData(cursorPos.x, cursorPos.y, 1,1).data;
		return pickedColor;
	}
	//pobranie wartości Hue (HSV) z RGB
	function getHue(rgb){
		const red=rgb[0];
		const green=rgb[1];
		const blue=rgb[2];

		let min = Math.min(Math.min(red, green), blue);
		let max = Math.max(Math.max(red, green), blue);

		if(min == max){
			return 0;
		}
		let hue = 0;
		if(max == red){
			hue = (green - blue) / (max - min);
		} else if (max == green) {
			hue = 2.0 + (blue - red) / (max - min);
		}else if(max == blue){
			hue = 4.0 + (red - green) /  (max - min);
		}
		hue *= 60;
		if (hue < 0) hue += 360;
		return Math.round(hue);
	}
	//Zmiana stylu tekstu podglądowego
	function changeTextStyle(hue, saturation, value){
		if (value <= 60 || (hue >210 && hue<280) && saturation>30) {
			viewText.classList.remove("blackText");
			viewText.classList.add("whiteText");
		}
		else {
			viewText.classList.remove("whiteText");
			viewText.classList.add("blackText");
		}
	}
	//konwersja z rgb na cmyk
	function RGBToCMYK(rgb){
        const red=rgb[0];
        const green=rgb[1];
        const blue=rgb[2];

        const redPrime =red/255;
        const greenPrime = green/255;
        const bluePrime = blue/255;

		let blackKey = 1-Math.max(redPrime, greenPrime, bluePrime);
		
        const cyan = (blackKey ==1)? 0 : 100 * ((1 - redPrime - blackKey) / (1 - blackKey));
        const magenta = (blackKey ==1)? 0 : 100 * ((1 - greenPrime - blackKey) / (1 - blackKey));
		const yellow = (blackKey ==1)? 0 : 100 * ((1 - bluePrime - blackKey) / (1 - blackKey));
		blackKey *= 100;

		const cmyk = [cyan, magenta, yellow, blackKey];
		return cmyk;
	}
	//konwersja z cmyk na rgb
	function CMYKtoRGB(cmyk){
		const cyan = cmyk[0] / 100;
		const magenta = cmyk[1] / 100;
		const yellow = cmyk[2] / 100;
		const black = cmyk[3] / 100;

		const red = 255 * (1-cyan) * (1-black);
		const green = 255 * (1-magenta) * (1-black);
		const blue = 255 * (1-yellow) * (1-black);

		const rgb = [red, green, blue];
		return rgb;
	}
	//konwersja rgb na hsv
	function RGBtoHSV(rgb){
		const red=rgb[0];
		const green=rgb[1];
		const blue=rgb[2];

		const redPrime = red/255;
		const greenPrime = green/255;
		const bluePrime = blue/255;

		cMax = Math.max(redPrime, greenPrime, bluePrime);
		cMin = Math.min(redPrime, greenPrime, bluePrime);

		const delta = cMax - cMin;

			let hue = 0;
		if(cMax == redPrime){
			hue = (60 * ((greenPrime - bluePrime) / delta) + 360) % 360; 
		} else if (cMax == greenPrime) {
			hue = (60 * ((bluePrime - redPrime) / delta) + 120) % 360; 
		}else if(cMax == bluePrime){
			hue = (60 * ((redPrime - greenPrime) / delta) + 240) % 360; 
		}
		if(isNaN(hue)==true){
			hue=0;
		}
		
		const saturation = (cMax != 0) ? (delta/cMax * 100) : 0;
		const value = (cMax * 100);
		changeTextStyle(hue, saturation, value);
		const hsv = [hue, saturation, value];
		return hsv;
	}
	//konwersja hsv na rgb
	function HSVtoRGB(hsv){
		const hue = hsv[0];
		const saturation = hsv[1] / 100;
		const value = hsv[2] / 100 ;
		changeTextStyle(hsv[0], hsv[1], hsv[2]);

		const c = value * saturation;
		const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
		const m = value - c;

		let rgbPrime= [c, x, 0];
		if (hue >= 60 && hue < 120) {rgbPrime = [x, c, 0];}
		else if (hue >= 120 && hue < 180) {rgbPrime = [0, c, x];}
		else if (hue >= 180 && hue < 240) {rgbPrime = [0, x, c];}
		else if (hue >= 240 && hue < 300) {rgbPrime = [x, 0, c];}
		else if (hue >= 300 && hue < 360) {rgbPrime = [c, 0, x];}
		
		const rgb = [(rgbPrime[0]+m)*255, (rgbPrime[1]+m)*255, (rgbPrime[2]+m)*255];
		
		return rgb;
		
	}
	//konwersja rgb na hex
	function RGBtoHEX(rgb){
		const red = Math.round(rgb[0]).toString(16);
		const green = Math.round(rgb[1]).toString(16);
		const blue = Math.round(rgb[2]).toString(16);
		let hex = [red,green,blue];
		hex = hex.map((element)=>{
			if(element.length == 1) return "0" + element;
			else return element;
		})
		return hex;
	}
	//konwersja hex na rgb
	function HEXtoRGB(hex){
		const red = parseInt(hex[0],16);
		const green = parseInt(hex[1],16);
		const blue = parseInt(hex[2],16);
		const rgb = [red, green, blue];
		return rgb;
	}
	
	//inputy RGB
	function rgbFiller(color){
		rgbColors=color;
		rgbInputs.forEach((element,key)=>{
			element.value = (changeReason == "canvas" || changeReason == "hex") ? rgbColors[key] : rgbColors[key].toFixed(2);

		})
	}
	//inputy CMYK
	function cmykFiller(color){
		cmykColors = RGBToCMYK(color);
		cmykInputs.forEach((element,key)=>{
			element.value = cmykColors[key].toFixed(2);
		})
	}
	//inputy HSV
	function hsvFiller(color){
		hsvColors = RGBtoHSV(color);
		hsvInputs.forEach((element,key)=>{
			element.value = hsvColors[key].toFixed(2);
		})
	} 
	//input HEX
	function hexFiller(color){
		hexColors = RGBtoHEX(color);
		hexInputs.forEach((element,key)=>{
			element.value = hexColors[key];
			if(key==3){
				element.value = hexColors[0]+hexColors[1]+hexColors[2];
			}
		})
	}
	//wpisywanie do inputów
	function inputFiller(reason,color){
		changeReason = reason;
		if(changeReason=="canvas"){
			rgbFiller(color);
			cmykFiller(color);
			hsvFiller(color);
			hexFiller(color);
		}
		else if(changeReason=="rgb"){
			cmykFiller(color);
			hsvFiller(color);
			hexFiller(color);
		}
		else if(changeReason=="cmyk"){
			color = CMYKtoRGB(color);
			rgbFiller(color);
			hsvFiller(color);
			hexFiller(color);
		}
		else if(changeReason=="hsv"){
			color = HSVtoRGB(color);
			rgbFiller(color);
			cmykFiller(color);
			hexFiller(color);
		}
		else if(changeReason=="hex"){
			color = HEXtoRGB(color);
			rgbFiller(color);
			cmykFiller(color);
			hsvFiller(color);
		}
		colorView.style.backgroundColor="rgb("+rgbColors[0]+","+rgbColors[1]+","+rgbColors[2]+")";
	}
	//kolorowy gradient na pasku bocznym
	colorBarCanvasContext.rect(0,0,colorBarCanvas.width, colorBarCanvas.height)
	let gradient = colorBarCanvasContext.createLinearGradient(0, 0, 0, colorBarCanvas.height);
	gradient.addColorStop(0, 'rgb(255, 0, 0)');
	gradient.addColorStop(0.17, 'rgb(255, 255, 0)');
	gradient.addColorStop(0.34, 'rgb(0, 255, 0)');
	gradient.addColorStop(0.51, 'rgb(0, 255, 255)');
	gradient.addColorStop(0.68, 'rgb(0, 0, 255)');
	gradient.addColorStop(0.85, 'rgb(255, 0, 255)');
	gradient.addColorStop(1, 'rgba(255, 0, 0)');
	colorBarCanvasContext.fillStyle = gradient;
	colorBarCanvasContext.fill();
	drawCanvas(0);

	//Pobieranie koloru z #colorPalette
	colorPaletteCanvas.addEventListener("mousedown",(e)=>{
		dragPallete = true;
		rgbColors = getColor(e, colorPaletteCanvas);
		colorView.style.backgroundColor = `rgb(${rgbColors[0]}, ${rgbColors[1]}, ${rgbColors[2]})`;
		inputFiller('canvas', rgbColors);
	},false)
	colorPaletteCanvas.addEventListener("mousemove",(e)=>{
		if(dragPallete) {
			{rgbColors = getColor(e, colorPaletteCanvas);
			colorView.style.backgroundColor = `rgb(${rgbColors[0]}, ${rgbColors[1]}, ${rgbColors[2]})`;
			inputFiller('canvas', rgbColors);
			}
		}
	},false)
	colorPaletteCanvas.addEventListener("mouseup",(e)=>{
		dragPallete = false;
		
	},false)
	//Pobieranie koloru z #colorBar
	colorBarCanvas.addEventListener("mousedown",(e)=>{
		drawCanvas(getHue(getColor(e, colorBarCanvas, true)));
	},false)
	rgbInputs.forEach((element)=>{
		element.addEventListener("input",()=>{
			if(element.value > 255){element.value = 255;}
			else if(element.value <0) element.value = 0;
			rgbColors[0] = rgbInputs[0].value;
			rgbColors[1] = rgbInputs[1].value;
			rgbColors[2] = rgbInputs[2].value;
			inputFiller("rgb", rgbColors);
		})
	})
	cmykInputs.forEach((element)=>{
		element.addEventListener("input",()=>{
			if(element.value > 100) element.value = 100;
			else if(element.value <0) element.value = 0;
			cmykColors[0] = cmykInputs[0].value;
			cmykColors[1] = cmykInputs[1].value;
			cmykColors[2] = cmykInputs[2].value;
			cmykColors[3] = cmykInputs[3].value;
			inputFiller("cmyk", cmykColors);
		})
	})
	hsvInputs.forEach((element,key)=>{
		element.addEventListener("input",()=>{
			if(key == 0 && element.value >360) element.value = 360;
			else if((key == 1 || key == 2) && element.value > 100) element.value = 100;
			else if(element.value <0) element.value = 0;
			hsvColors[0] = hsvInputs[0].value;
			hsvColors[1] = hsvInputs[1].value;
			hsvColors[2] = hsvInputs[2].value;
			inputFiller("hsv", hsvColors);
		})
	})
	hexInputs.forEach((element)=>{
		element.addEventListener("input",()=>{
			if(parseInt(element.value, 16) > parseInt('FF',16)) element.value = "ff";
			else if(parseInt(element.value, 16) < 0) element.value = "00";
			//sprawdzanie czy jest jeden znak w wartości
			hexColors[0] = (hexInputs[0].value.length == 1) ? hexInputs[0].value + hexInputs[0].value : hexInputs[0].value;
			hexColors[1] = (hexInputs[1].value.length == 1) ? hexInputs[1].value + hexInputs[1].value : hexInputs[1].value;
			hexColors[2] = (hexInputs[2].value.length == 1) ? hexInputs[2].value + hexInputs[2].value : hexInputs[2].value;
			hexInputs[3].value = hexColors[0]+hexColors[1]+hexColors[2];
			inputFiller("hex", hexColors);
		})
	})
})
