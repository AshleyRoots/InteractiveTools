var taal;
var cnr; // canvas raster
var cng; // canvas grafiek
var xras = 300; // grafiek grootte x
var yras = 200; // grafiek grootte y
var dxras = 35; // raster afstand
var dyras = 20;
var ml = 45;	// margin links
var mr = 10;	// margin rechts
var mt = 10;	// margin boven
var mb = 20;	// margin onder

// Schaal x,y assen
var minx = 0;
var stepx = 30;
var maxx = 480;
var miny = -1.2;
var stepy = 0.2;
var maxy = 1.2;

var harm_arr = new Array();	// harmonischen array
var hars_arr = new Array();	// Fase array
var hal = 0;						// harmonischen array lengte
			
var isdrag;			// muisslepen actief (of niet)
var dobj;			// object waarop geklikt is
var gobj;			// grandparent object waarop geklikt is


/*** Artikel onload aangeroepen vanuit "xmlactie" ***/
function art_init() {
	taal = (document.getElementById('taal').value == 'en')? 'en':'nl';
	isdrag = false;
	var canvasr = document.getElementById('art_rooster');
	if (canvasr.getContext) {
		cnr = canvasr.getContext("2d");
	}
	var canvasg = document.getElementById('art_grafiek');
	if (canvasg.getContext) {
		cng = canvasg.getContext("2d");
	}
	init_grafiek();
	grafiek_raster();
	var i = 0;
	while (document.getElementById('sknop'+i)) {
		var obj = document.getElementById('sknop'+i);
		(browser == 'IE')? obj.attachEvent('onmousedown', schuifknopin) : obj.addEventListener('mousedown', schuifknopin, false);
		obj.addEventListener('touchstart', schuifknopin, false);
		i++;
	}
	
	var obj = document.getElementById('webapi').getElementsByTagName('button');
	if (obj.length > 0) {
		obj[0].addEventListener('click', function(e) {freqSound(e,0);}, false);
		obj[0].addEventListener('touchstart', function(e) {freqSound(e,0);}, false);
		obj[1].addEventListener('click', function(e) {freqSound(e,1);}, false);
		obj[1].addEventListener('touchstart', function(e) {freqSound(e,1);}, false);
		obj[2].addEventListener('click', function(e) {amplSound(e,0);}, false);
		obj[2].addEventListener('touchstart', function(e) {amplSound(e,0);}, false);
		obj[3].addEventListener('click', function(e) {amplSound(e,1);}, false);
		obj[3].addEventListener('touchstart', function(e) {amplSound(e,1);}, false);
		document.getElementById('freqval').addEventListener('change', freqInput, false);
	}
	
	document.getElementById('freqval').value = 440.0;
	set_harmonischen('sinus');
}


/*** Set sin/cos ***/
function set_sin(dit,ha) {
	if (dit.innerHTML == 'sin') {
		dit.innerHTML = 'cos';
		hars_arr[ha] += Math.PI/2;
	}
	else {
		dit.innerHTML = 'sin';
		hars_arr[ha] -= Math.PI/2;
	}
	grafiek_signaal();
	updateSoundWave();
}

/*** Set pos/neg ***/
function set_pol(dit,ha) {
	if (dit.innerHTML == '+') {
		dit.innerHTML = '-';
		hars_arr[ha] += Math.PI;
	}
	else {
		dit.innerHTML = '+';
		hars_arr[ha] -= Math.PI;
	}
	grafiek_signaal();
	updateSoundWave();
}

/*** Positioneer schuiven en vul waardes vanuit array ***/
function set_schuifveld() {
	var i = 0;
	while (document.getElementById('sknop'+i)) {
		var ks = (i==0) ? 0.5 : 1;
		var obj = document.getElementById('sknop'+i);
		var spos = obj.parentNode.offsetHeight - harm_arr[i] * obj.parentNode.offsetHeight*ks;
		obj.style.top = spos-7+'px';
		document.getElementById('sw'+i).innerHTML = harm_arr[i].toFixed(3);
		if (i > 0) {
			var spb = document.getElementById('sh'+i).getElementsByTagName('button');
			var tmp = hars_arr[i];
			if (tmp > Math.PI*0.9) {
				tmp -= Math.PI; spb[1].innerHTML = '-';}
			else {
				spb[1].innerHTML = '+';}
			if (tmp > Math.PI*0.45) {
				spb[0].innerHTML = 'cos';}
			else {
				spb[0].innerHTML = 'sin';}
		}
		i++;
	}
}


/*** Op een schuifknop geklikt ***/
function schuifknopin(e) {
	e.preventDefault();
	var fobj = (browser == 'ok')? e.target : event.srcElement;
	if (fobj.className == 'schuifknop') {
		isdrag = true;
		dobj = fobj;
		gobj = dobj.parentNode.parentNode;
		(browser == 'IE')? gobj.attachEvent('onmouseup', schuifknoplos) : gobj.addEventListener('mouseup', schuifknoplos, false);
		gobj.addEventListener('touchend', schuifknoplos, false);
		(browser == 'IE')? gobj.attachEvent('onmouseleave', schuifknoplos) : gobj.addEventListener('mouseleave', schuifknoplos, false);
		gobj.addEventListener('touchleave', schuifknoplos, false);
		(browser == 'IE')? gobj.attachEvent('onmousemove', schuifknopslepen) : gobj.addEventListener('mousemove', schuifknopslepen, false);
		gobj.addEventListener('touchmove', schuifknopslepen, false);
		dobj.style.borderColor = '#F00';
	}
}


/*** Linker muisknop losgelaten of out ***/
function schuifknoplos(e) {
	if (gobj.className == 'schuifhouder') {
		isdrag = false;
		(browser == 'IE')? gobj.detachEvent('onmouseup', schuifknoplos) : gobj.removeEventListener('mouseup', schuifknoplos, false);
		gobj.removeEventListener('touchend', schuifknoplos, false);
		(browser == 'IE')? gobj.detachEvent('onmouseleave', schuifknoplos) : gobj.removeEventListener('mouseleave', schuifknoplos, false);
		gobj.removeEventListener('touchleave', schuifknoplos, false);
		(browser == 'IE')? gobj.detachEvent('onmousemove', schuifknopslepen) : gobj.removeEventListener('mousemove', schuifknopslepen, false);
		gobj.removeEventListener('touchmove', schuifknopslepen, false);
		dobj.style.borderColor = '#88A';
	}
}

/*** Slepen met de schuifknop ***/
function schuifknopslepen(e) {
	if (isdrag) {
		e.preventDefault();
		var ysl = (browser == 'ok')? e.pageY : event.pageY;
		var schuifbalk = dobj.parentNode;
		var yval = ysl - schuifbalk.offsetTop;
		if (yval < 0) {yval = 0;}
		if (yval > schuifbalk.offsetHeight) {yval = schuifbalk.offsetHeight;}
		dobj.style.top = yval-7+'px';
		var pros = (schuifbalk.offsetHeight - yval) / schuifbalk.offsetHeight;
		var i = parseInt(dobj.id.replace(/[^0-9]/g,''));
		var pros = (i==0) ? pros*2 : pros*1;
		pros = pros.toFixed(3);
		harm_arr[i] = pros;
		document.getElementById('sw'+i).innerHTML = pros;
		grafiek_signaal();
		updateSoundWave();
	}
}


/*** Schrijf signaal in grafiek ***/
function grafiek_signaal() {
	cng.clearRect(0, 0, xras+ml+mr, yras+mt+mb);
	cng.beginPath();
	cng.strokeStyle = '#00F';
	var ys = harm_arr[0]*yras/(maxy-miny);
	var yo = yras/2;
	var xs = (maxx-minx)*2*Math.PI/(xras*360);
	var xo = 0;
	var yval;
	var mulx;
	for (var i=0; i<=xras; i++) {
		yval = 0;
		mulx = i*xs;
		for (var ha=1; ha<hal; ha++) {
			yval += harm_arr[ha]*Math.sin((ha*mulx)+hars_arr[ha]);
		}
		yval = yo - yval*ys;
		
		if (i == 0) {
			cng.moveTo(i+ml, yval+mt);}
		else {
			cng.lineTo(i+ml, yval+mt);}
	}
	cng.stroke();
}


/*** Keuze standaard signalen ***/
function set_harmonischen(signaal) {
	var pi = Math.PI;
	switch(signaal) {
		case 'sinus' :
			harm_arr = new Array(1,1,0,0,0,0,0,0,0,0,0,0);
			hars_arr = new Array(0,0,0,0,0,0,0,0,0,0,0,0);
			break;
		case 'blok' :
			harm_arr = new Array(4/pi,1,0,0.3333,0,0.2,0,0.1429,0,0.1111,0,0.0909);
			hars_arr = new Array(0,0,0,0,0,0,0,0,0,0,0,0);
			break;
		case 'trapezium' :
			harm_arr = new Array(4/pi,0.993,0,0.314,0,0.168,0,0.101,0,0.06,0,0.033);
			hars_arr = new Array(0,0,0,0,0,0,0,0,0,0,0,0);
			break;
		case 'driehoek' :
			harm_arr = new Array(0.81,1,0,0.11111,0,0.04,0,0.02041,0,0.0123,0,0.0083);
			hars_arr = new Array(0,pi/2,0,pi/2,0,pi/2,0,pi/2,0,pi/2,0,pi/2);
			break;
		case 'zaagtand' :
			harm_arr = new Array(2/pi,1,0.5,0.333,0.25,0.2,0.1667,0.1429,0.125,0.1111,0.1,0.0909);
			hars_arr = new Array(0,0,0,0,0,0,0,0,0,0,0,0);
			break;
		case 'impuls' :
			harm_arr = new Array(0.18,1,0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2,0.1,0);
			hars_arr = new Array(0,0,pi*1.5,pi,pi/2,0,pi*1.5,pi,pi/2,0,pi*1.5,pi);
			break;
		case 'viool' :
			harm_arr = new Array(0.49,0.995,0.94,0.425,0.480,0,0.365,0.04,0.085,0,0.09,0);
			hars_arr = new Array(0,0,pi/2,0,pi/2,0,pi/2,0,pi/2,0,pi/2,0);
			break;
	}
	hal = harm_arr.length;
	set_schuifveld();
	grafiek_signaal();
	updateSoundWave();
}


/*** Initialiseer grafiek ***/
function init_grafiek() {
	xras = dxras*(maxx-minx)/stepx;
	yras = dyras*(maxy-miny)/stepy;
	var xveld = xras+ml+mr;
	var yveld = yras+mt+mb;
	cnr.canvas.width = xveld;
	cnr.canvas.height = yveld;
	cng.canvas.width = xveld;
	cng.canvas.height = yveld;
	cnr.clearRect(0, 0, xveld, yveld);
	var obj = document.getElementById('grafiek_vak');
	obj.style.width = xveld+'px';
	obj.style.height = yveld + 'px';
}

/*** Maak grafiek raster ***/
function grafiek_raster() {
	cnr.strokeStyle = '#888';
	cnr.lineWidth = 1;
	cnr.font = '8pt verdana';
	cnr.textBaseline = 'middle';
	var lab;
	// Horizontale raster lijnen
	cnr.textAlign = 'right';
	var lw = maxy;
	var dy = yras/10;
	for (var yi=0; yi<=yras; yi+=dyras) {
		cnr.beginPath();
		cnr.moveTo(0+ml-5, yi+mt);
		cnr.lineTo(xras+ml, yi+mt);
		cnr.stroke();
		lab = grafiek_label(lw, 3);
		cnr.fillText(lab, ml-8, mt+yi);
		lw -= stepy;
	}
	// Verticale raster lijnen
	cnr.textAlign = 'center';
	var lw = minx;
	for (var xi=0; xi<=xras; xi+=dxras) {
		cnr.beginPath();
		cnr.moveTo(xi+ml, 0+mt);
		cnr.lineTo(xi+ml, yras+mt+5);
		cnr.stroke();
		lab = grafiek_label(lw, 3);
		cnr.fillText(lab, ml+xi, mt+yras+12);
		lw += stepx;
	}
	// Grijs vlak
	var gsx = xras / (maxx - minx) * (360 - minx);
	cnr.fillStyle = 'rgba(0,0,0,0.1)';
	cnr.fillRect(gsx+ml,mt,xras-gsx,yras);
}


/*** Maak technische notatie labels ***/
function grafiek_label(waarde, deci) {
	var prefix = new Array('a','f','p','n','µ','m','','k','M','G','T','P','E');
	var pp = 6;
	var sgn = '';
	if (waarde > -1e-15 && waarde < 1e-15) {
		waarde = 0;
	}
	else {
		if (waarde < 0) {
			sgn = '-';
			waarde = Math.abs(waarde);
		}
		while (waarde >= 1000 && prefix[pp+1]) {
			waarde /= 1000;
			pp++;
		}
		while (waarde < 1 && prefix[pp-1]) {
			waarde *= 1000;
			pp--;
		}
		var sh = 0;
		if (waarde >= 100) {
			waarde /= 100;
			sh = 2;
		}
		else if (waarde >= 10) {
			waarde /= 10;
			sh = 1;
		}
		waarde = Math.round(Math.pow(10,deci)*waarde);
		waarde /= Math.pow(10,deci-sh);
	}
	return sgn+waarde+prefix[pp];
}

/*** Web Audio API ***/

var audioCtx = false;
var oscillator;
var volume;
var note = 0;
var ampl = 0;
var freq = 440.0;
var playing = false;


function calcFreq() {
	return Math.pow(2, note / 12)*440;
}

function setupSound() {
	if (audioCtx !== false) return;
	audioCtx = new AudioContext();
	oscillator = audioCtx.createOscillator();
	oscillator.frequency.value = calcFreq();
	//volume = audioCtx.createGainNode(); // oud
	volume = audioCtx.createGain(); // nieuw
	volume.gain.value = ampl;
	oscillator.connect(volume);
	volume.connect(audioCtx.destination);
	document.getElementById('freqval').value = calcFreq();
	playing = true;
	oscillator.start(0);
	//oscillator.noteOn(0);
}

function freqInput(e) {
	if (audioCtx === false) setupSound();
	var obj = e.target;
	freq = obj.value;
	if (freq < 1) {
		freq = 1;}
	if (freq > 20000) {
		freq = 20000;}
	oscillator.frequency.value = freq;
	document.getElementById('freqval').value = freq;
	note = Math.round((Math.log(freq / 440)/Math.log(2)) * 12);
}

function freqSound(e,dir) {
	e.preventDefault();
	if (audioCtx === false) setupSound();
	if (dir == 0) {
		note--; }
	else {
		note++; }
	freq = calcFreq(note);
	oscillator.frequency.value = freq;
	document.getElementById('freqval').value = freq.toFixed(1);
}

function amplSound(e,dir) {
	e.preventDefault();
	if (audioCtx === false) setupSound();
	if (dir == 0) {
		ampl -= 0.1;
		if (ampl < 0) ampl = 0; 
	} else {
		ampl += 0.1;
		if (ampl > 1) ampl = 1;
	}
	ampl = Math.round(ampl * 10) / 10;
	volume.gain.value = ampl;
	var obj = document.getElementById('amplval');
	document.getElementById('amplvalbar').style.width = parseInt(obj.offsetWidth * ampl)+'px';
	var nobj = document.getElementById('amplvalnum');
	if (Math.round(ampl * 10) == 0) nobj.innerHTML = 'off';
	else nobj.innerHTML = ampl;
}


function updateSoundWave() {
	if (audioCtx !== false) {
		var pi = Math.PI;
		var nHarm = 11+1;
		var curveSin = new Float32Array(nHarm);
		var curveCos = new Float32Array(nHarm);
		curveSin[0] = 0;
		curveCos[0] = 0;
		for (var i = 1; i < nHarm; i++) {
			curveSin[i] = harm_arr[i] * harm_arr[0] * Math.cos(hars_arr[i]);
			curveCos[i] = harm_arr[i] * harm_arr[0] * Math.sin(hars_arr[i]);
		}
		var waveTable = audioCtx.createPeriodicWave(curveCos, curveSin);
		oscillator.setPeriodicWave(waveTable);
	}
}
