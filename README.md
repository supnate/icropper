iCropper
========

iCropper is an image cropper written in pure javascript without any library dependency. It aims to be simple, fast and easy to use.

DEMO: http://supnate.github.io/icropper/demo.html

![alt tag](http://supnate.github.io/icropper/demo1.jpg)

Browser support
=========
IE 7+, Chrome, Firefox, Opera, Safari

Usage
=========
```js
var ic = new ICropper(
	'cropperContainer'    //Container id
	,{
		ratio: 1    //Set aspect ratio of the cropping area
		,image: 'demo.png'
		,preview: [
				'previewSmall'  //Preview node id
		]
	}
);
//use bindPreview to dynamically add preview nodes
ic.bindPreview('previewBig');
```

License
=======
MIT
