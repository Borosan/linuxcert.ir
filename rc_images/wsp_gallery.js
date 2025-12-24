// RocketCake Gallery implementation
// (c) by Nikolaus Gebhardt / Ambiera e.U.
function wsp_gallery()
{
	this.popUpWindow = null;
	this.layer = null;
	this.showingLayerImage = null;
	this.installedKeyHandler = null;
	
	this.winWidth = 640;
	this.winHeight = 480;
	
	this.showSingleImageNoBackground = false;
	this.currentOpenLayerURL = '';
}

wsp_gallery.prototype.openpopup = function(imgurl, width, height)
{
	var left = (screen.width-width)/2;
	var top = (screen.height-height)/2;
 
	// close old window and store position
	
	if (this.popUpWindow &&  this.popUpWindow.location && !this.popUpWindow.closed) 
	{
		left = this.popUpWindow.screenX;
		top = this.popUpWindow.screenY;
		this.popUpWindow.close();
	} 
	
	// reopen new window
	{
		var winWidth = width + 10;
		var winHeight = height + 10;
		var win = window.open(imgurl, "wsp_imgwindow",
			"width=" + winWidth + ",height=" + winHeight + "\",resizable=1,top=" + top + ",left=" + left);
		this.popUpWindow = win;
	}
}

wsp_gallery.prototype.openlayer = function(imgurl, width, height, usenavbuttons, galleryid)
{
	if (width <= 0 || height <= 0)
		return;
		
	this.closeLayer();
		
	if (this.layer == null)
	{	
		var l = document.createElement("div");
		
		l.style.position = "absolute";		
		l.style.overflow = "visible";
		l.style.verticalAlign = 'middle';
		l.style.textAlign = 'center';
		l.style.backgroundColor = document.body.style.backgroundColor; //'#ffffff';
		l.style.filter = 'Alpha(Opacity=100)';
		l.style.zIndex = '50';
		
		document.body.appendChild(l);	
		
		this.layer = l;		
	}
	
	document.body.style.overflow = 'hidden'; // stop scrolling
	
	var l = this.layer;
	
	var img = document.createElement("img");
	img.src = imgurl;
	img.onclick = function() { wsp_gallery.closeLayer() };
	this.currentOpenLayerURL = imgurl;
	
	this.updateBrowserWidth();
		
	if (this.showSingleImageNoBackground)
	{
		var posx = Math.round((this.winWidth - width) / 2 + document.body.scrollLeft);
		var posy = Math.round((this.winHeight - height) / 2 + document.body.scrollTop);
		
		img.style.width = width + 'px';
		img.style.height = height + 'px';	
			
		l.innerHTML = '';
		l.appendChild(img);
		l.style.left = posx + "px";
		l.style.top = posy + "px"; 
		l.style.display = 'block';
	}
	else
	{
		var showWidth = width;
		var showHeight = height;
		var showMarginX = 5;
		var showMarginY = 5;
		
		if (usenavbuttons)
			showMarginX += this.winWidth * 0.2;
		
		// if image is larger than screen, resize to fit screen
		
		if (showWidth > this.winWidth - showMarginX)
		{
			showWidth = this.winWidth - showMarginX;
			showHeight = showWidth * (height / width);
		}
		
		if (showHeight > this.winHeight - showMarginY)
		{
			showHeight = this.winHeight - showMarginY;
			showWidth = showHeight * (width / height);
		}
		
		// show on screen
	
		var scrollPosX = window.pageXOffset;
		var scrollPosY = window.pageYOffset;
		
		var posx = Math.round((this.winWidth - showWidth) / 2 + scrollPosX);
		var posy = Math.round((this.winHeight - showHeight) / 2 + scrollPosY);
				
		img.style.width = showWidth + 'px';
		img.style.height = showHeight + 'px';	
		img.style.left = posx + 'px';
		img.style.top = posy + 'px';
		img.style.position = 'absolute';
		img.style.zIndex = '51';
		
		this.showingLayerImage = img;
		
		document.body.appendChild(img);	
				
		l.innerHTML = '';
		l.style.left = scrollPosX + 'px';
		l.style.top = scrollPosY + 'px';
		l.style.width = '100%'; //this.winWidth + 'px';
		l.style.height = this.winHeight + 'px';
		l.style.backgroundColor = '#000000';
		l.style.opacity = '0.8';
		l.style.msFilter = 'alpha(opacity=80)' // For IE8 and earlier 
 
		l.style.display = 'block';
		
		l.onclick = function() { wsp_gallery.closeLayer() };
		//document.onkeydown = function(evt) 
		var keydownHandler = function(evt)
		{
			evt = evt || window.event;
			if (usenavbuttons && evt.keyCode == 37) // left
			{			
				wsp_gallery.cancelPropagation(evt);
				wsp_gallery.gotoNext(galleryid, true, true);
			}
			else
			if (usenavbuttons && evt.keyCode == 39) // right	
			{	
				wsp_gallery.cancelPropagation(evt);
				wsp_gallery.gotoNext(galleryid, false, true);
			}
			else
			if (evt.keyCode == 27) // escape
				wsp_gallery.closeLayer();
		}
		
		window.addEventListener('keydown', keydownHandler, false);
		wsp_gallery.installedKeyHandler = keydownHandler;
				
		// add navigation elements
		
		if (usenavbuttons)
		{
			for (var i=0; i<2; ++i)
			{
				var navl = document.createElement("div");
				l.appendChild(navl);
				navl.innerHTML = i == 0 ? '&#10094;' : '&#10095;';
				var posstr = i == 0 ? "left: 0;" : "right: 0;";
				
				navl.style.cssText = "		\
					display: block;							\
					background-color: rgb(0,0,0);	\
					color: rgb(255, 255, 255);					\
					" + posstr  + "						\
					position: absolute;						\
					height: 100%;							\
					width: 10%;								\
					cursor: pointer;								\
					z-index: 100;								\
					padding-top: 20%;						\
					font-size: 10vh;";
					
				navl.onmouseover  = function() { this.style.color = "#555555"; };
				navl.onmouseout  = function() { this.style.color = "#ffffff"; };
					
				if (i == 0)
					navl.onclick = function(event) 
					{ 
						wsp_gallery.cancelPropagation(event);						
						wsp_gallery.gotoNext(galleryid, true);  
					};
				else
					navl.onclick = function(event) 
					{ 
						wsp_gallery.cancelPropagation(event);												
						wsp_gallery.gotoNext(galleryid, false);  
					};

				navl.classList.add((i == 0) ? 'galleryprevbutton' : 'gallerynextbutton');
			}
		}
		
		// add close button
		
		if (true)
		{
			var closebtn = document.createElement("div");
			l.appendChild(closebtn);
			closebtn.innerHTML = '&#x00D7;';
				
			closebtn.style.cssText = "		\
				display: block;							\
				background-color: rgb(0,0,0);	\
				color: rgb(255, 255, 255);					\
				right: 0; top: 0;						\
				position: absolute;						\
				height: 50px;							\
				width: 50px;								\
				cursor: pointer;								\
				z-index: 100;								\
				padding-top: 0;						\
				font-size: 50px;";
				
			closebtn.onmouseover  = function() { this.style.color = "#555555"; };
			closebtn.onmouseout  = function() { this.style.color = "#ffffff"; };
			closebtn.classList.add('galleryclosebutton');
		}
	}
}


wsp_gallery.prototype.cancelPropagation = function(event)
{
	event.preventDefault(); 
	if (event.stopPropagation)
		event.stopPropagation();   // W3C model
	else
		event.cancelBubble = true; // IE model
}

wsp_gallery.prototype.gotoNext = function(galleryid, prev)
{
	var gal = document.getElementById(galleryid);
	if (!gal)
		return;
	
	var elems = gal.getElementsByTagName('a');
	var hrefToUse = null;
	
	for (var j = 0; j < elems.length; j++)
	{
		var strLink = elems[j].href;
		var key = "javascript:wsp_gallery.openlayer(";
		if (strLink.startsWith(key))
		{
			var url = strLink.substring(key.length+1, strLink.indexOf(',')-1);
			if (url == this.currentOpenLayerURL)
			{
				var nextElemIdx = 0;
				
				if (prev)
				{
					if (j == 0) 
						nextElemIdx = elems.length - 1;
					else
						nextElemIdx = j-1;				
				}
				else
					nextElemIdx = (j+1) % elems.length;
				
				hrefToUse = elems[nextElemIdx].href;
				break;
			}
		}
	}
	
	if (hrefToUse != null)
	{
		// if (useeval && hrefToUse.indexOf('javascript:') == 0)
		// {
		// 	var toeval = hrefToUse.substr(11);
		// 	eval(toeval);
		// 	return;
		// }
		// else
		{
			window.location = hrefToUse;
		}
	}
}


wsp_gallery.prototype.updateBrowserWidth = function()
{
	if (window.innerWidth)
	{
		this.winWidth = window.innerWidth;
		this.winHeight = window.innerHeight;
	}
	else
	{
		this.winWidth = document.body.clientWidth;
		this.winWidth = document.body.clientHeight;
	}	
}

wsp_gallery.prototype.closeLayer = function()
{
	if (wsp_gallery == null || wsp_gallery.layer == null)
		return;
		
	wsp_gallery.layer.style.display = 'none';
	
	document.body.style.removeProperty('overflow'); // make scrolling possible again
	
	window.removeEventListener('keydown', wsp_gallery.installedKeyHandler);
		
	try
	{
		if (wsp_gallery.showingLayerImage)
			document.body.removeChild(wsp_gallery.showingLayerImage);
	}
	catch(e)
	{
	}
}


wsp_gallery.prototype.replaceimg = function(imgurl, elemid, width, height)
{
	var imgelem = document.getElementById(elemid);
	if (imgelem == null)
		return;
		
	imgelem.src = imgurl;
}


var wsp_gallery = new wsp_gallery();