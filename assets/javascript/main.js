/**
 * This code is free software; you can redistribute it and/or modify it under
 * the terms of the new BSD License.
 *
 * Copyright (c) 2015-2016, Sebastian Staudt
 */

//=require 'jquery'
//=require 'bootstrap-sprockets'
//=require 'hammer'
//=require 'layzr'

HTMLImageElement.prototype.isLoaded = function() {
    if (typeof this.naturalWidth == 'number' && typeof this.naturalHeight == 'number') {
      return !(this.naturalWidth == 0 && this.naturalHeight == 0)
    } else if (typeof this.complete == 'boolean') {
      return this.complete
    } else {
      return true
    }
};

HTMLVideoElement.prototype.isLoaded = function() {
  return this.readyState == 4
};

var slideshowEnabled = false;
function slideshow() {
  slideshowEnabled = true;
  var thumbnails = $('.thumbnail');
  var nextImage = function() {
    thumbnails.eq(Math.floor(Math.random() * thumbnails.length)).click();
    if (slideshowEnabled) {
      setTimeout(nextImage, 5000);
    }
  };
  nextImage()
}

$(function(){
  var layzr = new Layzr({
    threshold: 5
  });

  var showTags = function(joinChar) {
    var tagNames = [];
    $('#selected-tags').find('span').each(function() {
      tagNames.push($(this).data('tag'))
    });

    location.href = $('body').data('base-url') + '/' + tagNames.join(joinChar)
  };

  $('.selected-tags .close').click(function() {
    $('#selected-tags').empty();
    $('.tag-selector').removeClass('hide');
    $('.list-group.tag-selection').removeClass('tag-selection');
    $('.selected-tags').collapse('hide')
  });

  $('#tag-selection-all').click(function() { showTags('+') });
  $('#tag-selection-one').click(function() { showTags(',') });

  $('.tag-selector').click(function(e) {
    e.preventDefault();

    $(this).addClass('hide');

    var tagSimpleName = $(this).data('tag');
    if ($("#selected-tags").find("span[data-tag='" + tagSimpleName + "']").length == 0) {
      var tag = $('<span class="btn btn-success fade" data-tag="' + tagSimpleName + '">' + $(this).data('name') + '</span>');
      tag.click(function() {
        $(this).remove();
        $(".tag-selector[data-tag='" + tagSimpleName + "']").removeClass('hide');

        if ($('#selected-tags').find('span').length == 0) {
          $('.list-group.tag-selection').removeClass('tag-selection');
          $('.selected-tags').collapse('hide');
        }
      });
      tag.hover(function() {
        $(this).toggleClass('btn-success').toggleClass('btn-danger');
      });
      tag.appendTo('#selected-tags');
      tag.addClass('in');
    }

    $('.list-group:not(.tag-selection)').addClass('tag-selection');
    $('.selected-tags:not(.in)').collapse('show');
  });

  var photoModal = $('#photo-modal');
  photoModal.on('show', function() {
    $('body').addClass("no-scroll");
    photoModal.addClass('in')
  });

  $(document).keydown(function(e) {
    if (!photoModal.hasClass('in')) {
      return;
    }

    switch (e.which) {
      case 27: // ESC
        photoModal.find('.backdrop').click();
        e.preventDefault();
        break;
      case 32: // SPACE
      case 39: // ->
        photoModal.find('.modal-next').click();
        e.preventDefault();
        break;
      case 37: // <-
        photoModal.find('.modal-prev').click();
        e.preventDefault();
        break;
      case 70: // F
        photoModal.find('img, video').click();
        e.preventDefault();
        break;
      case 73: // I
        photoModal.find('.metadata-button').click();
        e.preventDefault();
        break;
      case 83: // S
        slideshow();
        e.preventDefault()
    }
  });

  var pauseVideo = function() {
    photoModal.find('video').each(HTMLMediaElement.prototype.pause);
  };

  var hideModal = function() {
    pauseVideo();
    photoModal.removeClass('full');

    var body = $('body');
    body.removeClass("no-scroll");
    history.pushState(null, '', body.data('base-url'));

    photoModal.removeClass('in')
  };
  photoModal.find('.backdrop').click(hideModal);

  photoModal.find('.modal-next').click(function() {
    var currentUrl = $('#photo-modal').data('current-url');
    pauseVideo();
    $("a[href='" + currentUrl + "']").parent().next().find('a.thumbnail').click();
  });

  photoModal.find('.modal-prev').click(function() {
    var currentUrl = $('#photo-modal').data('current-url');
    pauseVideo();
    $("a[href='" + currentUrl + "']").parent().prev().find('a.thumbnail').click();
  });


  $("img.img_wrap").load(function() {
      var h = this.height;
      var w = this.width;
      $(this)[0].style.height = '100%';
      $(this).prev()[0].style.paddingBottom = h / w * 100 + '%';
      $(this).parent()[0].style.width = w / h * 200 + 'px';
      $(this).parent()[0].style.flexGrow = w / h * 200;
      $(this).parent()[0].style.position = 'relative';
  });


  $('a.photo').click(function(e) {
    e.preventDefault();

    var link = $(this);
    var imageUrl = link.attr('href');

    var url = $('body').data('base-url') + '/view/' + link.data('id');
    if (photoModal.hasClass('full')) {
      history.pushState(null, '', url + '/full');
    } else {
      history.pushState(null, '', url);
    }

    if (photoModal.data('current-url') == imageUrl) {
      photoModal.trigger('show');
      return
    }

    var fullView;
    var viewContainer = photoModal.find('.view-container');

    photoModal.data('current-url', imageUrl);
    if (link.data('type') == 'image') {
      fullView = $('<img>');
      fullView.attr('src', imageUrl);
    } else {
      var source = $('<source>');
      source.attr('src', imageUrl);
      fullView = $('<video controls>');
      fullView.attr('poster', imageUrl.replace('photos', 'previews'));
      fullView.append(source);
    }

    photoModal.find('.modal-next').toggleClass('in', link.parent().next().length == 1);
    photoModal.find('.modal-prev').toggleClass('in', link.parent().prev().length == 1);

    var display = function() {
      viewContainer.find('img, video').remove();
      viewContainer.prepend(fullView);
      fullView.click(function() {
        if (photoModal.hasClass('full')) {
          photoModal.removeClass('full');
          history.pushState(null, '', url);
        } else {
          photoModal.addClass('full');
          var fullUrl = url + '/full';
          history.pushState(null, '', fullUrl)
        }
      });

      photoModal.trigger('show');
    };

    var swipe = new Hammer.Manager(photoModal[0], { recognizers: [[ Hammer.Swipe, { direction: Hammer.DIRECTION_HORIZONTAL } ]] });
    swipe.on('swipeleft', function() {
      photoModal.find('.modal-prev').click()
    });
    swipe.on('swiperight', function() {
      photoModal.find('.modal-next').click()
    });
    swipe.set({ enable: true });

    var persons = $('.persons span');
    var tags = $('.tags span');

    persons.empty();
    tags.empty();

    var metadata = link.data('meta');
    $('.metadata-button').toggle(metadata.persons.length > 0 || metadata.tags.length > 0);
    if (metadata.persons.length) {
      metadata.persons.forEach(function(person, index) {
        if (index) {
          persons.append(', ')
        }
        persons.append('<a href="/persons/' + person.id + '">' + person.name + '</a>');
      });
      persons.parent().show()
    } else {
      persons.parent().hide()
    }

    if (metadata.tags.length) {
      metadata.tags.forEach(function(tag, index) {
        if (index) {
          tags.append(', ')
        }
        tags.append('<a href="/tags/' + tag.searchName + '">' + tag.name + '</a>');
      });
      tags.parent().show()
    } else {
      tags.parent().hide()
    }

    if (fullView[0].isLoaded()) {
      display()
    } else {
      if (link.data('type') == 'image') {
        fullView.load(display)
      } else {
        fullView.bind('loadedmetadata', display)
      }
    }
  });

  $('.metadata-button').click(function(e) {
    e.preventDefault();

    var metadata = $('.metadata');
    var info = $(this).find('.fa-stack-1x');
    var infoBg = $(this).find('.fa-stack-2x');
    if (metadata.css('left') == '0px') {
      metadata.css('left', '100%');
      infoBg.removeClass('fa-circle-o').addClass('fa-circle');
      info.addClass('fa-inverse')
    } else {
      metadata.css('left', '0px');
      infoBg.removeClass('fa-circle').addClass('fa-circle-o');
      info.removeClass('fa-inverse')
    }
  });

  var currentPhoto = $('a.thumbnail.current');
  if (currentPhoto.length == 1) {
    currentPhoto.click();
    currentPhoto[0].scrollIntoView()
  }




var svg = document.querySelector("svg");
var draggable = false;
var rid = null;
var m = { x: 0, y: 0 };
var t = { x: 100, y: 100 }; // translate

var dx = 0; // distance between the center of the balloon and the click point

var spring = 0.09;
var friction = 0.80;

	var slider_target = {
		x:0,
		y:0,
		r:5,
		fontSize:5
	};
	var slider_pos = {
		x:0,
		y:0,
		r:5,
		fontSize:5
	};

	var slider_vel = {
		x:0,
		y:0,
		r:0,
		fontSize:0
	};
var slider_thumb = {
  props: { cx: 0, cy: 0, r: 2,style:"pointer-events: none;" },
  tagName: "circle"
};
var slider_balloon = {
  props: { cx: 0, cy: 0, r: 5 },
  tagName: "circle"
};
var slider_label = {
  props: { x: 0, y: 0,style:"font-size:5px" },
  tagName: "text",
  text_content: "50"
};
slider_thumb['elmt'] = drawElement(slider_thumb, '_thumb');
slider_balloon['elmt'] = drawElement(slider_balloon, '_thumb');
slider_label['elmt'] = drawElement(slider_label, '_thumb');

 function slider_getThisTargetY(){
	  if(draggable){
		slider_target.y = -11;
		slider_target.r = 9;
		slider_target.fontSize = 8;
		  }else{
		slider_target.y = 0;
		slider_target.r = 5;
		slider_target.fontSize = 5;};
  }

 function slider_getThisTargetX(m){
  slider_target.x = m.x - dx;
  if (slider_target.x < -50) {
    slider_target.x = -50 ;
  }
  if (slider_target.x > 50) {
    slider_target.x = 50;
  }
  }

 function  slider_getNewPos(prop){//x,y,r,fontSize
    var dist = slider_target[prop] - slider_pos[prop];
    var acc = dist * spring;
    slider_vel[prop] += acc;
    slider_vel[prop] *= friction;
    slider_pos[prop] += slider_vel[prop];
  }

 function slider_update(){
	slider_getNewPos("y");
	slider_getNewPos("x");
	slider_getNewPos("r");

    slider_thumb.props.cx = slider_target.x;
    slider_balloon.props.cx = slider_pos.x;
    slider_label.props.x = slider_pos.x;
	slider_label.elmt.textContent = Math.round(slider_target.x) + 50;
     rescale(Math.round(slider_target.x) + 50);
	slider_label.props.y = slider_balloon.props.cy = slider_pos.y;
	slider_label.props.style = "font-size:"+slider_target.fontSize+"px"
	slider_balloon.props.r = slider_pos.r;

	updateElement(slider_label);
	updateElement(slider_thumb);
	updateElement(slider_balloon);
  }

function drawElement(o, parent) {
  var SVG_NS = "http://www.w3.org/2000/svg";
  var elmt = document.createElementNS(SVG_NS, o.tagName);
  for (var name in o.props) {
    if (o.props.hasOwnProperty(name)) {
      elmt.setAttributeNS(null, name, o.props[name]);
    }
  }
  if (o.text_content) {
    elmt.textContent = o.text_content;
  }
  document.getElementById(parent).appendChild(elmt);
  return elmt;
}

function updateElement(o) {
  for (var name in o.props) {
    if (o.props.hasOwnProperty(name)) {
      o.elmt.setAttributeNS(null, name, o.props[name]);
    }
  }
}

function oMousePosSVG(e) {
  var p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  var ctm = svg.getScreenCTM().inverse();
  p = p.matrixTransform(ctm);
  return p;
}

function transformedMousePos(e, t) {
  var m = oMousePosSVG(e);
  var ret = {x: m.x - t.x, y: m.y - t.y};
  return ret;
}

function Animation() {
  requestId = window.requestAnimationFrame(Animation);
  slider_update();
}

Animation();

slider_balloon.elmt.addEventListener("mousedown",
  function(e) {
	e.preventDefault();
	draggable = true;
    svg.style.cursor = "move";
    m = transformedMousePos(e, t);// mouse position
	  // distance between the center of the balloon and the click point
    dx = m.x - this.getAttributeNS(null, "cx");
    slider_getThisTargetY();
  },
  false
);

svg.addEventListener("mouseup",
  function(e) {
    draggable = false;
    svg.style.cursor = "default";
    slider_getThisTargetY();
  },
  false
);

svg.addEventListener("mousemove", function(e) {
  if (draggable) {
	m = transformedMousePos(e, t);
    slider_getThisTargetX(m)
  } else {
    svg.style.cursor = "default";
  }
});
});


function rescale(scale) {
  $("img.img_wrap").each(function() {
      var h = this.height;
      var w = this.width;
      $(this)[0].style.height = '100%';
      $(this).prev()[0].style.paddingBottom = h / w * 100 + '%';
      $(this).parent()[0].style.width = w / h * scale + 'px';
      $(this).parent()[0].style.flexGrow = w / h * scale;
      $(this).parent()[0].style.position = 'relative';
  });
}

