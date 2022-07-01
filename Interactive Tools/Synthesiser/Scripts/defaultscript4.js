// HTML5 dingen goedpraten voor IE
document.createElement("article");
document.createElement("footer");
document.createElement("header");
document.createElement("section");
document.createElement("nav");
document.createElement("figure");
document.createElement("figcaption");

var taal = 'en';
var menuobj = false;
var browser = 'ok';
var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
var lastReactElm;
var reactieStart;

if (re.exec(navigator.userAgent) != null) {
	if (parseFloat(RegExp.$1) < 10) {
		browser = 'IE';}
}
(browser == 'ok')? window.addEventListener('load', laden_init, false):window.attachEvent('onload', laden_init);
if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
	browser = 'touch'; // Maar wat te doen met IE10 met muisbesturing?
}

/*** On page load ***/
function laden_init() {
	// Javascript detected
	if (document.getElementById('js_script_uit')) {
		document.getElementById('js_script_uit').style.display = 'none';
	}
	// Taal
	taal = (document.getElementById('taal') && document.getElementById('taal').value == 'en')? 'en':'nl';
	// Init dropdown menu touch devices
	if (browser == 'touch') {
		var menudrop = document.getElementById('menudropdown').getElementsByClassName('hmenu');
		var nm = menudrop.length;
		for (var i=0; i<nm; i++) {
			menudrop[0].addEventListener('touchstart', menutouch, false);
			menudrop[0].className = 'htmenu';
		}
	}
	makeupCodeTags();
	// Als artikel initialisatie nodig is ...
	if (typeof art_init == 'function') {
		art_init();
	}
	// Reacties
	if (document.getElementById('reactieform')) {
		lastReactElm = document.getElementById('reactieform');
		reactieStart = 0;
		if (window.reactiesData) {
			try {
				plaatsReacties(JSON.parse(reactiesData));
			} catch(err) {
				document.getElementById('meerreactiesknop').innerHTML = (taal == 'nl')? 'Er ging iets verkeerd bij het ophalen van de reacties.':'Something went wrong when retrieving the comments.';
			}
			
		}
	}
}

/*** Dropdown menu touch devices ***/
function menutouch(e) {
	if (browser == 'touch') {
		e.stopPropagation();
		var nobj = e.target;
		var memac = false;
		if (nobj.className == 'tmenu') {
			if (nobj != menuobj) {
				nobj.style.height = '17px';
				nobj.style.backgroundColor = '#EEF';
				nobj.style.borderColor = '#66A';
				var ulobj = nobj.parentNode.getElementsByTagName('ul')[0];
				ulobj.style.visibility = 'visible';
				ulobj.style.opacity = '1';
				ulobj.style.transitionDelay = '0s';
				memac = true;
			}
			if (menuobj !== false) {
				menuobj.style.height = '16px';
				menuobj.style.backgroundColor = '#DDF';
				menuobj.style.borderColor = '#DDF';
				var ulobj = menuobj.parentNode.getElementsByTagName('ul')[0];
				ulobj.style.visibility = 'hidden';
				ulobj.style.opacity = '0';
				//ulobj.style.transitionDelay = 'visibility 0s linear 0.3s, opacity 0.3s linear';
			}
			menuobj = (memac === false)? false : nobj;
		}
	}
}

/*** Maak een XMLHttpRequest Object ***/
function GetXmlHttpObject() {
	var xmlHttp=null;
	try  // Firefox, Opera 8.0+, Safari
		{xmlHttp=new XMLHttpRequest();}
	catch (e) {
		try  // Internet Explorer
			{xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");}
		catch (e)
			{xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");}
	 }
	return xmlHttp;
}


/*** Verzend (POST) data naar de server ***/ 
function verzend_data(post_para) {
	xmlHttp=GetXmlHttpObject();
	if (xmlHttp==null) {
		alert ('Your browser is outdated and does not support HTTP Request'); return; } 
	xmlHttp.open("POST", '/incfs/ajax_actie.php', true);
	xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	//xmlHttp.setRequestHeader("Content-length", post_para.length);
	//xmlHttp.setRequestHeader("Connection", "close");
	xmlHttp.onreadystatechange = ajax_melding;
	xmlHttp.send(post_para);
}


/*** terugmelding van de server ***/
function ajax_melding() {
	if(xmlHttp.readyState == 4) {
		if(xmlHttp.status == 200) {
			var resultaat = xmlHttp.responseText;
			resultaat = unescape(resultaat);
			var resarr = resultaat.split('~#~');
			switch(resarr[0]) {
				case 'inlog_check':
					xml_inlog_check(resarr);
					break;
				case 'verwijder_reactie':
					xml_verwijder_reactie(resarr);
					break;
				case 'verwijder_bericht':
					xml_verwijder_bericht(resarr);
					break;
				default:
					alert('Oeps, daar ging wat fout, geen flauw idee wat.'+"\n"+resultaat);
			}
			//alert('Test : '+"\n"+resultaat);
		}
	}
}


/*** Vertaal tekst met html tags naar ubb-code ***/
function code_html_ubb(transtxt) {
	var chtml = new Array();
		chtml[0] = /\<a\shref="([^"]+)("\starget="_blank"|")\>([^\<]+)\<\/a\>/gi;
		chtml[1] = /\<img(.+)src="(.+)\.(gif|jpg|png)"([^\>]+)>/gi;
		chtml[2] = /\<([\/]?)(h1|h2|h3|h4|h5)\>/gi;
		chtml[3] = /\<([\/]?)(b|i|u|s|sub|sup)\>/gi;
		chtml[4] = /(\<br([^\>]*)\>{2,})/gi;
		chtml[5] = /\<br([^\>]*)\>/gi;
	var cubb = new Array();
		cubb[0] = "[url=$1]$3[/url]";
		cubb[1] = "[img]$2.$3[/img]";
		cubb[2] = "[$1kop]";
		cubb[3] = "[$1$2]";
		cubb[4] = "\n\n";
		cubb[5] = "\n";
	for (var i=0; i<chtml.length; i++) {
		transtxt = transtxt.replace(chtml[i], cubb[i]);}
	return transtxt;
}


/*** Vertaal tekst met ubb-code naar html tags ***/
function code_ubb_html(transtxt) {
	var cubb = new Array();
		cubb[0] = /\[url=(http(s?):\/\/?)([^\]]+)\]([^\[]+)\[\/url\]/gi;
		cubb[1] = /\[url=(http(s?):\/\/?)([^\]]+)\]\[\/url\]/gi;
		cubb[2] = /\[img\]([^\[]+)\[\/img\]/gi;
		cubb[3] = /\[([\/]?)(kop)\]/gi;
		cubb[4] = /\[([\/]?)(b|i|u|s|sub|sup)\]/gi;
		cubb[5] = /\n/gi;
	var chtml = new Array();
		chtml[0] = "<a href=\"$1$3\" target=\"_blank\">$4</a>";
		chtml[1] = "<a href=\"$1$3\" target=\"_blank\">$3</a>";
		chtml[2] = "<img class=\"userimg\" src=\"$1\" alt=\"\" onload=\"userimg_schalen(this);\">";
		chtml[3] = "<$1h2>";
		chtml[4] = "<$1$2>";
		chtml[5] = "<br>";
	for (var i=0; i<cubb.length; i++) {
		transtxt = transtxt.replace(cubb[i], chtml[i]);}
	return transtxt;
}

function addslashes(str) {
	str = str.replace(/\\/g, '\\\\');
	str = str.replace(/\'/g, '\\\'');
	str = str.replace(/\"/g, '\\"');
	str = str.replace(/\0/g, '\\0');
	return str;
}
 
function stripslashes(str) {
	str = str.replace(/\\'/g, '\'');
	str = str.replace(/\\"/g, '"');
	str = str.replace(/\\0/g, '\0');
	str = str.replace(/\\\\/g, '\\');
	return str;
}

function uitlegtekst(fobj, zichtbaar, tekst) {
	var ulvak = document.getElementById('uitleg_vak');
	ulvak.style.display = zichtbaar ? 'block' : 'none';
	ulvak.innerHTML = '<img class="uitlegpijl" src="/images/uitlegpijl.gif">'+tekst;
	var poff = vindPos(fobj);
	ulvak.style.left = poff[0]+fobj.offsetWidth+11+'px';
	ulvak.style.top = poff[1]-10+'px';
}


/*** Vind de absolute coördinaten van een element op de pagina ***/
function vindPos(obj) {
	var links = 0;
	var boven = 0;
	if (obj.offsetParent) {
		do {
			links += obj.offsetLeft;
			boven += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [links, boven];
}

/*** Inlog gegevens checken ***/
function post_inlog_check() {
	var post_para = 'actie=inlog_check';
	post_para += '&taal='+encodeURIComponent(document.forms['inlog_form'].taal.value);
	post_para += '&inlog_naam='+encodeURIComponent(document.forms['inlog_form'].inlog_naam.value);
	post_para += '&inlog_ww='+encodeURIComponent(document.forms['inlog_form'].inlog_ww.value);
	verzend_data(post_para);
}

/*** Resultaat terug van inlog check ***/
function xml_inlog_check(resarr) {
	document.getElementById('inlog_melding').style.display = 'block';
	if (resarr[1] != '') {
		document.getElementById('inlog_melding').innerHTML = resarr[1];}
	else {
		document.getElementById('inlog_melding').innerHTML = 'Inlog correct';
		document.forms['inlog_form'].submit();
	}
}

/*** Uitloggen ***/
function uitlogklik() {
	document.forms['inlog_form'].uitlog.value = 'uitloggen'
	document.forms['inlog_form'].submit();
}

/*** Inlogvenster zichtbaar maken ***/
function inlogklik() {
	document.getElementById('inlogvak').style.display = 'block';
	document.getElementById('inlog_melding').style.display = 'none';
	document.getElementById('inlog_melding').innerHTML = '';
	document.forms['inlog_form'].inlog_naam.focus();
}

/*** Inlogvenster sluiten ***/
function inlog_popup_sluiten() {
	document.getElementById('inlogvak').style.display = 'none';
}

/*** Extern geladen plaatjes herschalen ***/
function userimg_schalen(plaatje) {
	var paw = plaatje.parentNode.clientWidth - 24;
	if (plaatje.offsetWidth > paw) {
		plaatje.style.height = parseInt((plaatje.offsetHeight * paw) / plaatje.offsetWidth)+'px';
		plaatje.style.width = paw+'px';
	}
}

/*** Postknop in berichtform ***/
function post_bericht() {
	document.getElementById('vervolg').value = document.getElementById('vervolgveld').value;
	document.getElementById('fototitel').value = window.frames['fotoframe'].document.getElementById('titel').value;
	document.berichtform.submit();
}

/*** Bericht verwijderen ***/
function verwijder_bericht(bid) {
	var post_para = 'actie=verwijder_bericht';
	post_para += '&berichtid='+bid;
	verzend_data(post_para);
}

function xml_verwijder_bericht(resarr) {
	var melding = (resarr[2] == 'OK')? '<h2>Het bericht is verwijderd</h2>':'<h2>Het bericht kon niet verwijderd worden</h2>';
	document.getElementsByClassName('postvak')[0].innerHTML = melding;
}

/*** LATER ALGEMEEN MAKEN***/
/*** POST JSON data naar de server ***/ 
function verzendData(postPara) {
	if (window.XMLHttpRequest) {
		xmlHttp = new XMLHttpRequest();
		xmlHttp.open("POST", '/incfs/aja_reacties.php', true);
		xmlHttp.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
		//xmlHttp.setRequestHeader("Content-length", postPara.length);
		//xmlHttp.setRequestHeader("Connection", "close");
		xmlHttp.responseType
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
				plaatsReacties(JSON.parse(xmlHttp.responseText));
			}
		}
		xmlHttp.send(JSON.stringify(postPara));
	}
}


/*** Plaats reacties met data van de server ***/
function plaatsReacties(da) {
	var ntot = parseInt(da.header.ntot);
	var nres = parseInt(da.header.nres);
	var start = parseInt(da.header.start);
	if (ntot == 0) {
		var kobj = document.getElementById('meerreactiesknop');
		kobj.innerHTML = (taal == 'nl')? 'Er zijn nog geen reacties':'There are no comments yet';
		kobj.onclick = null;
	}
	else {
		var i = 0;
		var dobj, elm, ilm, tekst;
		while ('r'+i in da) {
			dobj = da['r'+i];
			// Reactie wrapper
			welm = document.createElement('div');
			welm.className = 'reactiewrapper';
			lastReactElm.parentNode.insertBefore(welm, lastReactElm);
			lastReactElm = welm;
			// Reactie kop
			tekst = ((taal == 'nl')? 'Op ':'At ')+dobj.datum+', '+dobj.tijd+((taal == 'nl')? ' schreef ':' wrote ');
			elm = document.createElement('h6');
			elm.className = 'reactiekop';
			elm.innerHTML = tekst;
			welm.appendChild(elm);
			// Auteur link
			ilm = document.createElement('a');
			tekst = ((taal == 'nl')? '/gebruiker/':'/user/')+dobj.urlnaam+'.html';
			ilm.setAttribute('href', tekst);
			ilm.innerHTML = dobj.naam;
			elm.appendChild(ilm);
			if (dobj.dr == 1) {
				ilm = document.createElement('span');
				ilm.className = 'banknop';
				ilm.title = (taal == 'nl')? 'Reactie verwijderen':'Remove Comment';
				ilm.value = dobj.rid;
				ilm.onclick = verwijder_reactie;
				ilm.innerHTML = 'X';
				elm.appendChild(ilm);
			}
			if (dobj.er == 1) {
				ilm = document.createElement('span');
				ilm.className = 'editknop';
				ilm.title = (taal == 'nl')? 'Reactie wijzigen':'Change comment';
				ilm.value = dobj.rid;
				ilm.onclick = edit_reactie;
				ilm.innerHTML = 'Edit';
				elm.appendChild(ilm);
			}
			// Reactie tekst
			elm = document.createElement('div');
			elm.className = 'reactietekst';
			elm.id = 'reactie'+dobj.rid;
			var rte = stripslashes(dobj.reactie);
			rte = rte.replace(/\<img[^\>]+\>/g, "<br>&lt;&lt; external images temporarily disabled &gt;&gt;<br>");
			elm.innerHTML = rte;
			welm.appendChild(elm);
			i++;
		}
		reactieStart = start + nres;
		if (reactieStart >= ntot) {
			document.getElementById('meerreactiesknop').style.display = 'none';
		}
		else {
			var ntxt = reactieStart+' van de '+ntot+' reacties geladen.<br>&downarrow;&downarrow; Klik hier om oudere reacties te laden &downarrow;&downarrow;';
			var etxt = reactieStart+' from '+ntot+' comments loaded.<br>&downarrow;&downarrow; Click here to load older comments &downarrow;&downarrow;';
			document.getElementById('meerreactiesknop').innerHTML = (taal == 'nl')? ntxt:etxt;
		}
	}
}

/*** Laden Reacties ***/
function laadReacties() {
	document.getElementById('meerreactiesknop').innerHTML = (taal == 'nl')? 'Reacties worden geladen, een moment geduld ...':'Loading comments, please wait ...';
	var artid = document.getElementById('artikel_id').value;
	var artgroep = document.getElementById('artgroep').value;
	var postPara = {"gid":"2", "artid":artid, "artgroep":artgroep, "taal":taal, "start":reactieStart};
	verzendData(postPara);
}

/*** Knop: Reactie Edit ***/
function edit_reactie(e) {
	var reactie_id = e.target.value;
	if (document.getElementById('reactie_edit_id').value != '') {
		var annuleer_id = document.getElementById('reactie_edit_id').value;
		edit_reactie_annuleren();
	}
	if (annuleer_id != reactie_id) {
		document.getElementById('reactie_edit_id').value = reactie_id;
		var reactie_tekst = document.getElementById('reactie'+reactie_id).innerHTML;
		document.getElementById('reactie_tekst_org').value = reactie_tekst;
		reactie_tekst = code_html_ubb(reactie_tekst);
		var tm1 = (taal == 'nl')? 'Wijzigingen opslaan':'Save modification';
		var tm2 = (taal == 'nl')? 'Wijzigen':'Modify';
		var tm3 = (taal == 'nl')? 'Annuleren':'Cancel';
		var tm4 = (taal == 'nl')? 'Wijzigingen niet opslaan':'Don\'t save modifications';
		document.getElementById('reactie'+reactie_id).innerHTML = '<textarea id="ReactieEditTekst" name="ReactieEditTekst" cols="65" rows="8" maxlength="2000">'+reactie_tekst+'</textarea>';
		document.getElementById('reactie'+reactie_id).innerHTML += '<br><button type="submit" name="ReactiePost" value="Wijzigen" title="'+tm1+'">'+tm2+'</button>&nbsp;&nbsp;<button type="button" value="Annuleren" title="'+tm4+'" OnClick="edit_reactie_annuleren();">'+tm3+'</button>';
		document.getElementById('reactie_post_blok').style.visibility = 'hidden';
	}
}

/*** Knop: Reactie Annuleren ***/
function edit_reactie_annuleren() {
	var reactie_id = document.getElementById('reactie_edit_id').value;
	document.getElementById('reactie'+reactie_id).innerHTML = document.getElementById('reactie_tekst_org').value;
	document.getElementById('reactie_edit_id').value = '';
	document.getElementById('reactie_post_blok').style.visibility = 'visible';
}

/*** Knoppen: Reactie verwijderen ***/
function verwijder_reactie(e) {
	var reactie_id = e.target.value;
	var post_para = 'actie=verwijder_reactie';
	post_para += '&reactieid='+reactie_id;
	verzend_data(post_para);
}

/*** Terugmelding Reactie Verwijderen ***/
function xml_verwijder_reactie(resarr) {
	if (resarr[2] == 'VerwijderOK') {
		var mtxt = '*** OK :: Deze reactie is verwijderd. ***';}
	else {
		var mtxt = '*** FOUT :: Er is een fout opgetreden bij het verwijderen. ***';}
	document.getElementById('reactie'+resarr[1]).innerHTML = mtxt;
	document.getElementById('reactie'+resarr[1]).style.backgroundColor="#888";
	document.getElementById('reactie'+resarr[1]).style.color="#FFF";
}

/*** Mooimaken code tags (alleen Arduino)***/
function makeupCodeTags() {
	var i = 0;
	var codeo = new Array();
		codeo[i++] = /^([^"]*)("[^"]*")(.*)$/g;
		codeo[i++] = /(\s)(loop|setup|Serial)/g;
		codeo[i++] = /(\s|\()(void|boolean|byte|int|long|unsigned|float|double)(\s)/g;
		codeo[i++] = /(\s|\()(if|else|for|switch|case|default|break)(\s+(\(|\{))/g;
		codeo[i++] = /(\s|\()(status|delay|false|true|sqrt)(\s|\))/g;
		codeo[i++] = /(\.)(begin|print|println|send)(\s*\()/g;
		codeo[i++] = /(\s|\()(delay|digitalWrite|digitalRead|bitSet|bitClear|bitWrite|bitRead|pinMode|analogReference|analogRead)(\s*\()/g;
		codeo[i++] = /(\s|\()(INPUT|OUTPUT|LOW|HIGH|INTERNAL|EXTERNAL|DEFAULT)/g;
		codeo[i++] = /(\/\/[^\n]*)/g;
		codeo[i++] = /(\/\*.*\*\/)/g;
		codeo[i++] = /\n\t\t/m;
		codeo[i++] = /\n\t\t/g;
	i = 0;
	var coder = new Array();
		coder[i++] = "$1<span class=\"code_blue\">$2</span>$3";
		coder[i++] = "$1<span class=\"code_ain\"><b>$2</b></span>";
		coder[i++] = "$1<span class=\"code_ain\">$2</span>$3";
		coder[i++] = "$1<span class=\"code_ain\">$2</span>$3";
		coder[i++] = "$1<span class=\"code_ain\">$2</span>$3";
		coder[i++] = "$1<span class=\"code_ain\">$2</span>$3";
		coder[i++] = "$1<span class=\"code_ain\">$2</span>$3";
		coder[i++] = "$1<span class=\"code_blue\">$2</span>";
		coder[i++] = "<span class=\"code_com\">$1</span>";
		coder[i++] = "<span class=\"code_com\">$1</span>";
		coder[i++] = "";
		coder[i++] = "<br>";
		
	elmList = document.getElementsByTagName('code');
	for (i=0; i<elmList.length; i++) {
		var codetxt = elmList[i].innerHTML;
		for (var j=0; j<codeo.length; j++) {
			codetxt = codetxt.replace(codeo[j], coder[j]);}
		elmList[i].innerHTML = codetxt;
	}
}
