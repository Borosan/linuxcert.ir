// RocketCake Menu implementation
// (c) by Nikolaus Gebhardt / Ambiera e.U.
// parameters:
// elementid: Element id of the root menu item
// animations: combination of 'fadeMenus', 'moveHeight'
// openViaMouseHovering: if set to true, on desktop, open menu already via mouse hovering. If set to false, only close and open the menu when clicked or touched.

function wsp_menu(elementid, menuidsuffix, panepadding, animations, openViaMouseHovering, advancedOptions)
{
	this.menuElementSubMenuParent = document.getElementById(elementid);
	this.menuElementEntryHolder = null;
	
	this.generateAriaLabels = true;
	this.setUsefulTabIndices = true;
	this.closeWhenMouseOut = false;
	this.mobileMenuIsFullscreen = false;
	this.mobileMenuCloseButtonColor = '#A3A3A3';
	
	this.UseAnimationForAll = animations != null; // animation setting for all menupanes
	this.EnabledAnimationsForAll = animations; // animations to be used for all menupanes
	
	this.UseAnimationForMobileMenu = animations != null;  // animation setting for mobile menupanes
	this.EnabledAnimationsForMobileMenu = animations; // animations to be used for mobile menupanes
	this.MenuPaddingUsed = 0;
	
	if (advancedOptions)
	{
		// generate missing aria labels
		if (typeof advancedOptions.generateAriaLabels != 'undefined')
			this.generateAriaLabels = advancedOptions.generateAriaLabels;
		
		// auto set tab indices
		if (typeof advancedOptions.setUsefulTabIndices != 'undefined')
			this.setUsefulTabIndices = advancedOptions.setUsefulTabIndices;
		
		// close when mouse out option
		if (typeof advancedOptions.closeWhenMouseOut != 'undefined')
			this.closeWhenMouseOut = advancedOptions.closeWhenMouseOut;
		
		// mobile menu is fullscreen
		if (typeof advancedOptions.mobileMenuIsFullscreen != 'undefined')
			this.mobileMenuIsFullscreen = advancedOptions.mobileMenuIsFullscreen;
		
		// mobile menu close button color
		if (typeof advancedOptions.mobileMenuCloseButtonColor != 'undefined')
			this.mobileMenuCloseButtonColor = advancedOptions.mobileMenuCloseButtonColor;
		
		// used padding for menu so we can scroll the fullscreen mobile menu correctly
		if (typeof advancedOptions.menuPaddingUsed != 'undefined')
			this.MenuPaddingUsed = advancedOptions.menuPaddingUsed;
		
		// forced animations for mobile menu
		if (typeof advancedOptions.mobileMenuAnimations != 'undefined')
		{
			this.UseAnimationForMobileMenu = advancedOptions.mobileMenuAnimations != null;
			this.EnabledAnimationsForMobileMenu = advancedOptions.mobileMenuAnimations;
		}
	}
	
	if (this.menuElementSubMenuParent)
	{
		var divs = this.menuElementSubMenuParent.getElementsByTagName('div');
		if (divs.length)
		{
			this.menuElementEntryHolder = divs[0];		
			
			if (this.menuElementEntryHolder && this.menuElementEntryHolder.id.indexOf('_menualignmentwrapper') > -1)
			{
				// menu has an alignment wrapper, so the entry holder is below it
				divs = this.menuElementEntryHolder.getElementsByTagName('div');
				if (divs.length)
				{
					this.menuElementSubMenuParent = this.menuElementEntryHolder;
					this.menuElementEntryHolder = divs[0];					
				}
			}				
		}	
	}
	
	this.rootMenuElements = new Array();
	this.menuPanes = new Array();
	this.menuidsuffix = menuidsuffix;
	this.panepadding = panepadding;
	this.initialClientHeight = 0;
	this.currentlyVisibleMenuPane = null;
	this.openViaMouseHovering = openViaMouseHovering; 
	this.openAndCloseViaClick = !openViaMouseHovering
	WspMenusLastTimeClicked = 0;  // global if using more than one menu
	this.LastOpenedSubMenu = null;
	this.TimeLastMenuFocused = 0;
	
	if ( typeof document["wspMenuGlobalTabIndex"] == "undefined" )
	{
		if (this.setUsefulTabIndices)
			document.wspMenuGlobalTabIndex = 1; // variable for global tabindex tracking in case we have more than one menu
		else
			document.wspMenuGlobalTabIndex = 0; // keep at 0 and let browser assign tab indices
	}
	
	try {
		if (wsp_allmenus == null)
			wsp_allmenus = new Array();
	} catch(e)
	{
		wsp_allmenus = new Array();
	}
	
	wsp_allmenus.push(this);
	
	var me = this;
	
	document.addEventListener("click", function(e) { me.clickedOutside(); } );
	
	if (this.closeWhenMouseOut)
	{
		document.addEventListener("mousemove", function(e)
		{ 
			me.closeMenuWhenFocusedElementIsNotPartOfMenu(e.target);  
		});		
	}
				

	if (this.menuElementSubMenuParent != null)
		this.menuElementSubMenuParent.style.overflow = "visible";

	if (this.menuElementEntryHolder != null)
		this.menuElementEntryHolder.style.overflow = "hidden";
	
	
	this.createMenuForItem = function(menuelementid, elementData, isForMobileMenu)
	{
		var elm = document.getElementById(menuelementid);
		if (elm == null)
			return;
		
		elm.tabIndex = document.wspMenuGlobalTabIndex; // ensure focusable by keyboard
		if (this.setUsefulTabIndices)
			document.wspMenuGlobalTabIndex += 1;
		
		this.rootMenuElements.push(elm);
		var menupane = this.createMenuElements(elm, elementData, false, isForMobileMenu);
		this.menuPanes.push(menupane);
				
		var me = this;
		var openAndCloseViaClick = me.openAndCloseViaClick;
		if (isForMobileMenu && me.mobileMenuIsFullscreen) 
			openAndCloseViaClick = true; // for fullscreen mobile menu, force opening and closing via click so that it closes again when clicked on the menu button again, that's what users expect how it works
		
		elm.openAndCloseViaClick = openAndCloseViaClick;
		
		elm.onclick = function(e)  
		{ 
			if (openAndCloseViaClick && (me.getTimeMs() - me.TimeLastMenuFocused)< 250) // when menu is in click mode, we get focus and then click event. Prevent closing again in this case.
				return;
		
			me.onMenuitemHoveredOrClicked(this, true); 
		};
		
		elm.onfocus = function(e)   // support for tab traversal of menu: open menu when focused
		{
			me.TimeLastMenuFocused = me.getTimeMs(); // when menu is in click mode (openAndCloseViaClick), we get focus and then click event. Record time to prevent closing again in this case.
			
			me.onMenuitemHoveredOrClicked(this, true); 
		}; 
		
		var onfocusoutfunction = function(e) { me.closeMenuWhenFocusedElementIsNotPartOfMenu(e.relatedTarget); };
		elm.addEventListener("focusout", onfocusoutfunction );	
		
		var needsTouchForOpeningNotHover = isForMobileMenu && this.mobileMenuIsFullscreen; // when mobile menu is fullscreen, users won't like it when it opens via hover
		
		if (this.openViaMouseHovering && !needsTouchForOpeningNotHover)
			elm.onmouseover = function(e) { me.onMenuitemHoveredOrClicked(this, false); };		
	}
	
	
	this.isElementPartOfTheMenu = function(elem)
	{
		var test = elem;
		var isInMenu = false;
		
		while(test)
		{
			if (this.menuElementSubMenuParent === test ||
				this.menuElementEntryHolder == test)
			{
				isInMenu = true;
				break;
			}
			
			test = test.parentNode;
		}
		
		return isInMenu;
	}
	
	
	this.closeMenuWhenFocusedElementIsNotPartOfMenu = function(newElementWithFocus)
	{				
		if (!this.isElementPartOfTheMenu(newElementWithFocus))
			this.closeAllMenus();
	}
	
	
	this.createMenuElements = function(htmlelement, elementData, issubmenu, isForMobileMenu)
	{
		if (htmlelement == null)
			return;
			
		if (elementData == null || elementData.length == 0)
			return;
			
		var me = this;
		var menupane = document.createElement("div");
		
		menupane.style.position = "absolute";		
		menupane.style.left = (htmlelement.offsetLeft) + "px";
		menupane.style.top = (htmlelement.clientHeight + this.panepadding) + "px";
		menupane.style.overflow = "visible";
		menupane.style.zIndex = 10;
		menupane.id = this.menuidsuffix + "_pane";	
		menupane.creationParentMenuElement = htmlelement;
		
		menupane.style.visibility = 'hidden';	
		menupane.style.display = 'block';	
		
		// copy animation settings for this pane
		
		if (isForMobileMenu)
		{
			menupane.UseAnimation = this.UseAnimationForMobileMenu;
			menupane.EnabledAnimations = this.EnabledAnimationsForMobileMenu;
		}
		else
		{
			menupane.UseAnimation = this.UseAnimationForAll;
			menupane.EnabledAnimations = this.EnabledAnimationsForAll;
		}
		
		// set style based on animation
				
		if (menupane.UseAnimation && this.isUsingFadeMenuPaneAnimations(menupane))
			menupane.style.transition = "opacity 0.5s ease-out";
		
		this.menuElementSubMenuParent.appendChild(menupane);	
		
		menupane.subMenus = new Array();
		
		var maxWidth = 0;
		var maxHeight = 0;
		
		var aentries = new Array();
		
		var submenusExist = false;
		
		for (var i=0; i<elementData.length; i+=3)
		{			
			var elementContent = elementData[i+1];
			var elementTarget  = elementData[i+2];
			
			// test width of text
			var testElement = document.createElement("span");
			var textToMeasure = elementData[i];
			
			if (elementContent instanceof Array )
			{
				// has a sub menu
				
				// for elements with submenu and sub menu indicator, only measure the inner text,
				// which is the second appearing span				
				
				var beginText = textToMeasure.indexOf('<span', textToMeasure.indexOf('<span')+1);
				var endText = textToMeasure.indexOf('</span><span style="display:inline-block;', beginText);
				
				textToMeasure = textToMeasure.substring(beginText, endText);
			}
			
			testElement.innerHTML = textToMeasure;
			this.menuElementEntryHolder.appendChild(testElement);
						
			var width = testElement.offsetWidth;
			var height = testElement.offsetHeight;
			this.menuElementEntryHolder.removeChild(testElement);
			
			// now create real element		
			var aentry = document.createElement("a");	
			aentry.tabIndex = -1;			
			
			var menuentry = document.createElement("div");
			
			menuentry.tabIndex = document.wspMenuGlobalTabIndex; // ensure focusable by keyboard
			if (this.setUsefulTabIndices)
				document.wspMenuGlobalTabIndex += 1;
			
			var txt = null;
			
			if (elementData[i] != '-')
				//txt = document.createTextNode(elementData[i]);
				menuentry.innerHTML = elementData[i];
			else
			{
				txt = document.createElement('hr');
				txt.id = this.menuidsuffix + "_hr";
			}
			
			aentry.appendChild(menuentry);
			if (txt != null)
				menuentry.appendChild(txt);
			menupane.appendChild(aentry);
						
			if (elementContent instanceof Array )
			{
				// sub menu
				var submenu = this.createMenuElements(menupane, elementContent, true);
				menupane.subMenus.push(submenu);
							
				menuentry.onclick = 
					function(me, submenu) { return function() { me.onSubMenuEntryHovered(submenu); } }(me, submenu);
					
				menuentry.onmouseover = 
					function(me, submenu) { return function() { me.onSubMenuEntryHovered(submenu); } }(me, submenu);
					
				menuentry.onfocus = 
					function(me, submenu) { return function() { me.onSubMenuEntryHovered(submenu); } }(me, submenu); // support for tab traversal of menu: open menu when focused
					
				var onfocusoutfunction = function(me, submenu) { return function(e) { me.closeMenuWhenFocusedElementIsNotPartOfMenu(e.relatedTarget); } }(me, submenu);
				menuentry.addEventListener("focusout", onfocusoutfunction );					
								
				submenusExist = true;
			}
			else
			{
				// normal link
				aentry.href = elementContent;
				
				if (elementTarget != null && elementTarget != '')
					aentry.setAttribute('target', elementTarget);
				
				// write to use link as tabindex, so that links can be activated using ENTER
				var oldTabIndex = menuentry.tabIndex;
				menuentry.tabIndex = -1;
				aentry.tabIndex = oldTabIndex;	
				
				var onfocusoutfunction = function(me) { return function(e) { me.closeMenuWhenFocusedElementIsNotPartOfMenu(e.relatedTarget); } }(me);		
				aentry.addEventListener("focusout", onfocusoutfunction );

				// aria label				
				if (this.generateAriaLabels)
				{
					var label = testElement.innerText || testElement.textContent;
					if (label)
						aentry.ariaLabel = label.trim();
				}
			}
			
			menuentry.id = this.menuidsuffix + "_entry";
			aentries.push(menuentry);
					
			maxWidth = Math.max(maxWidth, width);
			maxHeight += height; //txt.clientHeight;
		}
		
		if (submenusExist)
			maxWidth += 20; // add space for the arrow right symbol for submenus
		
		for (var j=0; j<aentries.length; ++j)
			aentries[j].style.width = maxWidth + "px";
			
		for (var j=0; j<menupane.subMenus.length; ++j)
			menupane.subMenus[j].style.left = (htmlelement.offsetLeft + maxWidth + panepadding*2) + "px";
		
		maxWidth += panepadding*2;
		menupane.style.width = maxWidth + "px"; 
		menupane.style.whiteSpace = 'nowrap'; // in case for embedded images
		menupane.aentries = aentries;
		
		if (isForMobileMenu && this.mobileMenuIsFullscreen)
		{		
			// make mobile menu fullscreen with close button
			menupane.style.width = "100vw";
			menupane.style.left = "0px";
			var startpos = this.menuElementEntryHolder.getBoundingClientRect().bottom;
			var paddingAdd = this.MenuPaddingUsed * 2; // top and bottom
			menupane.style.top =  startpos + "px";
			menupane.style.position = 'fixed';
			
			var dvhsupported = false;
			if (typeof CSS !== "undefined" && typeof CSS.supports !== "undefined")
				dvhsupported = CSS.supports('height: 100dvh');
			
			if (dvhsupported)
				menupane.style.maxHeight = 'calc(-' + (startpos+paddingAdd) + 'px + 100dvh)'; // dvh for mobile safari because floating address bar would overlap otherwise
			else
				menupane.style.maxHeight = 'calc(-' + (startpos+paddingAdd) + 'px + 100vh)';
			
			menupane.style.overflowY = 'scroll';
						
			// the mobile menu is fixed to overlap other elements, but we still need it to scroll vertically, so make it do this with
			// the following code, *unless* the parent menu or its containing container is also fixed, then we must not do this since it 
			// would scroll out of the view
			if (!isElemFixed(htmlelement))
				makeElementScroll(menupane, startpos);
						
			// add close button
			var closebtn = document.createElement("a");							
			closebtn.href = 'javascript:void(0)';									
			closebtn.style.cssText = 'position: absolute; top: 0; right: 30px; font-size: 42px; text-decoration: none;'; 
			closebtn.style.color = this.mobileMenuCloseButtonColor;
			closebtn.textContent = '×'; // × or × or &times;					
			closebtn.ariaLabel = 'close menu';
			menupane.appendChild(closebtn);					
		}
		
		this.setStylesForVisibilityOfMenuPane(menupane, false);
						
		return menupane;
	}
	
	function makeElementScroll(element, startpos) 
	{
		function updatePosition() 
		{
			element.style.top = (startpos - window.scrollY) + 'px';

			requestAnimationFrame(updatePosition);			
		}

		updatePosition();
	}


	function isElemFixed(elm) 
	{
		while (elm && elm.nodeName.toLowerCase() !== 'body')
		{
			if (window.getComputedStyle(elm).getPropertyValue('position').toLowerCase() === 'fixed')
				return true;
			elm = elm.parentNode;
		}
		return false; 
	}

	
	this.closeAllMenus = function()
	{
		for (var i=0; i<wsp_allmenus.length; ++i)
		{
			var m = wsp_allmenus[i];
			m.showMenuPaneWithIndex(-1);
			
			// also close sub menus
			m.closeOpenSubMenu();
		}		
	}
	
	this.closeOpenSubMenu = function()
	{
		if (this.LastOpenedSubMenu != null)
		{
			this.setStylesForVisibilityOfMenuPane(this.LastOpenedSubMenu, false);
			
			this.LastOpenedSubMenu = null;
		}
	}
	
	this.isMenuPaneWithIndexOpen = function(i)
	{
		var paneToCheck = null;
		if (i >= 0 && i < this.menuPanes.length)
			paneToCheck = this.menuPanes[i];
		return (paneToCheck && 	this.currentlyVisibleMenuPane === paneToCheck);
	}
	
	this.showMenuPaneWithIndex = function(i)
	{
		if (this.currentlyVisibleMenuPane)
			this.setStylesForVisibilityOfMenuPane(this.currentlyVisibleMenuPane, false);
				
		var newpane = null;
		if (i >= 0 && i < this.menuPanes.length)
			newpane = this.menuPanes[i];
		
		this.currentlyVisibleMenuPane = newpane;
		
		if (newpane)
		{
			this.setStylesForVisibilityOfMenuPane(newpane, true);
			
			// also, update position
			var htmlelement = newpane.creationParentMenuElement;
			
			if (newpane.style.position != 'fixed') // don't modify position of fullscreen window
			{
				newpane.style.left = (htmlelement.offsetLeft) + "px";			
				newpane.style.top = (htmlelement.clientHeight) + "px";
				this.ensureNotOutsideOfScreen(newpane);
			}
		}
	}
	
	// main menu item hovered
	this.onMenuitemHoveredOrClicked = function(itemHovered, actuallyThisWasAClick)
	{
		WspMenusLastTimeClicked = this.getTimeMs();
			
		// check if a root menu item has been hovered. If so, show its menu
		for (var i=0; i<this.rootMenuElements.length; ++i)
		{
			if (itemHovered === this.rootMenuElements[i])
			{
				var closeMenuAgain = false;
				
				if (actuallyThisWasAClick 
					&& (this.openAndCloseViaClick || this.rootMenuElements[i].openAndCloseViaClick) // <- fullscreen mobile menus will open close via click and can override the global setting
					&& this.isMenuPaneWithIndexOpen(i))
				{
					closeMenuAgain = true;
				}
				
				this.closeAllMenus();
				
				if (!closeMenuAgain)
					this.showMenuPaneWithIndex(i);
				break;
			}
		}
	}
	
	// menu entry hovered, probably show sub menu
	this.onSubMenuEntryHovered = function(submenu)
	{
		this.closeOpenSubMenu();
		
		this.setStylesForVisibilityOfMenuPane(submenu, true)
		
		this.LastOpenedSubMenu = submenu;
		
		WspMenusLastTimeClicked = this.getTimeMs();
	}
	
	
	this.clickedOutside = function()
	{
		if ((this.getTimeMs() - WspMenusLastTimeClicked)< 250)
			return;
			
		this.closeAllMenus();
	}
	
	
	this.getTimeMs = function()
	{
		var d = new Date();
		return d.getTime();
	}
	
	this.ensureNotOutsideOfScreen = function(elem)
	{
		try
		{
			var pos = this.getElementAbsPosition(elem);
			var scrollbarMargin = 20;
			
			if (pos.left + pos.width > window.innerWidth - scrollbarMargin  )
			{
				var deltaX = (pos.left + pos.width) - (window.innerWidth - scrollbarMargin);
				if (pos.left - deltaX < 0)
					deltaX += pos.left - deltaX;
				
				var currentPos = parseInt(elem.style.left);				
				elem.style.left = (currentPos - deltaX) + 'px';
			}
		}
		catch(e)
		{
		}
	}
	
	this.setStylesForVisibilityOfMenuPane = function(menupane, show)
	{
		if (show)
		{
			if (!menupane.UseAnimation)
				menupane.style.display = 'block'; // reduces viewport size if animations are not necessary
			
			menupane.style.visibility = 'visible';	

			if (menupane.UseAnimation && this.isUsingFadeMenuPaneAnimations(menupane))
				menupane.style.opacity = 1;		

			if (menupane.UseAnimation && this.isUsingMoveHeightAnimations(menupane))
				for (var j=0; j<menupane.aentries.length; ++j)
				{
					menupane.aentries[j].style.transition = "margin 0.5s ease";
					menupane.aentries[j].style.marginTop = '0px';							
				}
		}
		else
		{
			// hide
			if (!menupane.UseAnimation)
				menupane.style.display = 'none'; // reduces viewport size if animations are not necessary
			
			menupane.style.visibility = 'hidden';
			
			if (menupane.UseAnimation && this.isUsingFadeMenuPaneAnimations(menupane))
				menupane.style.opacity = 0;		

			if (menupane.UseAnimation && this.isUsingMoveHeightAnimations(menupane))
				for (var j=0; j<menupane.aentries.length; ++j)
					menupane.aentries[j].style.marginTop = (10 + j*-10) + 'px';	
		}
	}
	
	this.isUsingMoveHeightAnimations = function(menupane)
	{
		return menupane.EnabledAnimations && menupane.EnabledAnimations.indexOf('moveHeight') >= 0;
	}
	
	this.isUsingFadeMenuPaneAnimations = function(menupane)
	{
		return menupane.EnabledAnimations && menupane.EnabledAnimations.indexOf('fadeMenus') >= 0;
	}
		
	this.getElementAbsPosition = function(element) 
	{
		var top = 0;
		var left = 0;
		var width = element.offsetWidth;
		var height = element.offsetHeight;	
		
		do 
		{
			top += element.offsetTop  || 0;
			left += element.offsetLeft || 0;
			element = element.offsetParent;
		} 
		while(element);
		
		// this does the same but doesn't work on older browsers:
		// var rct = element.getBoundingClientRect();
		// top = rct.top;
		// left = rct.left;
		// width = rct.right - rct.left;
		// height = rct.bottom - rct.top;
		
		var obj = new Object();
		
		obj.top = top;
		obj.left = left;
		obj.width = width;
		obj.height = height;
		
		return  obj;
	}
	
} // end function wsp_menu