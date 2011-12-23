/**
 * HTML5Uploader
 * JS class allows upload files from local disk to server using drag and drop method
 * 
 * Tested on:
 * 		Mozilla Firefox 6.0.1
 * 		Google Chrome 7.0.517.41
 * 		Safari 5.0.2
 * 		WebKit r70732
 * 
 * @since 05.09.2011
 * @author Krzysztof Wilczek (Weeby)
 * 
 * Options:
 * 		Boolean	ignore_invalid_browsers			- Don't throw errors when browser is invalid for HTML5Uploader
 * 		Boolean	ignore_incorrect_files_types	- Don't throw exeption when file extension wasn't good
 * 		String	status_placeholder				- If is selected then display file reading progress
 * 		String	preview_class					- CSS class name of IMG element created for uploaded file preview
 * 		String	preview_placeholder				- HTML element id where new preview IMG should be displayed
 *		Boolean	show_preview					- If true then create IMG for uploaded file preview 
 *		String	input_file						- Input file on HTML form used to alternative upload action
 *		Array	files_types						- List of supported files types 
 *			
 *		Boolean	send_queued						- If true then send images one by one in queue	
 *		Boolean send_simple_one					- If true send only first image from droped files list		
 *		
 *		Function onLoadStart					- Fired when file is started to be loaded to browser
 *		Function onUploadEnd					- Fired when file load is ended
 *		Function onPreview						- Fired when file is puted to preview
 *		Function onInputFileChange				- Fired when input_file change state
 *		Function onDropOver						- Fired when user moves object over drop field
 *		Function onDropOut						- Fired when user moves object out of drop field
 *		Funciion onCreate						- Fired when new instation on HTLM5Uploader is created
 *
 * WEB resources:
 * http://blog.weeby.pl/wgrywanie-plikow-za-pomoca-techniki-drag-drop-html5/ 
 * http://code.google.com/p/html5uploader/
 * http://www.html5rocks.com/en/features/file
 **/
	
function HTML5Uploader(html_object_id, server_file, options) {
	
	
	/**
	 * Upload of selected file to server
	 * @param String file
	 */
	this.upload = function(file)
	{
	
		/**
		 * Check XHR readyState and status (look for end file upload)
		 * If options.send_queued then fire next file upload
		 * @param Object file
		 */
		this.sendToServerState = function(xhr, file)
		{
			if (xhr.readyState==4)
		    {
				// Add onUploadEnd function handling
				if (self.options.onUploadEnd)
				{
					if (xhr.response)
					{
						self.options.onUploadEnd(file, xhr.response);
					}
					else
					{
						self.options.onUploadEnd(file, xhr.responseText);
					}
				}
				
				// Go to next file in queue if files are queued
				if (self.options.send_queued)
				{
					self.file_id = self.file_id + 1;
					if (self.file_id < self.files.length)
					{
						self.upload(self.files[self.file_id]);
					}
				}
				
				
		    }
		}
		
		/**
		 * Image preview load end (shows simple image)
		 * @param Object event
		 */
		this.previewLoadEnd = function(event)
		{
			var binary = event.target.result;
			var img = document.createElement("img");
			img.className = (self.options.preview_class) ? self.options.preview_class : img.className = 'uploaded';
		    img.file = file;   
		    img.src = binary;
		    if (self.options.preview_placeholder)
		    {
		    	document.getElementById(self.options.preview_placeholder).appendChild(img);	
		    }
		    else
		    {
		    	document.getElementById(self.html_object_id).appendChild(img);
		    }
		    
		    // Add handler for onPreview user function
		    if (self.options.onPreview)
		    {
		    	self.options.onPreview(img);
		    }
		    
		}
		
		/**
		 * Image preview after upload, work only for FireFox, WebKit and Chrome
		 * To display image preview in safari need to use your own onUploadEnd function (get image data from server)
		 * @param String file
		 */
		this.imagePreview = function(file)
		{
			if (window.FileReader)
			{
				var preview = new FileReader();
				// Preview for Firefox 3.6, WebKit
				if(preview.addEventListener) { 
					preview.addEventListener('loadend', this.previewLoadEnd, false);
				// Chrome 7	
				} else { 
					preview.onloadend = this.previewLoadEnd;
				}
			
		 		preview.readAsDataURL(file);
			}
		}
		
		/**
		 * Simple file send by XMLHttpRequest (for Safari)
		 * @param Object file
		 */
		this.XHRSimpleSend = function(file)
		{
			xhr = new XMLHttpRequest();
			xhr.open('POST', self.server_file+'?up=true', true);
			xhr.setRequestHeader('UP-FILENAME', file.name);
			xhr.setRequestHeader('UP-SIZE', file.size);
			xhr.setRequestHeader('UP-TYPE', file.type);
			xhr.onreadystatechange = function() { upload.sendToServerState(this, file); }
			xhr.send(file); 
			
			// Show preview of upload image
			if (self.options.show_preview)
			{
				self.imagePreview(file);
			}
		}
		
		/**
		 * When file read file must be sended to server
		 * @param Object event
		 **/
		this.readerLoadEnd = function(event)
		{
			// Get binary data of file
			var binary = event.target.result;

			// Create new XMLHttpRequest
			xhr = new XMLHttpRequest();
			
			// Since Firefox 3.6 we can use sendAsBinary function 
			if (xhr.sendAsBinary) 
			{ 
				xhr.open('POST', self.server_file + '?up=true', true);
				var boundary = 'xxxxxxxxx';
				var body = '--' + boundary + "\r\n";  
				body += "Content-Disposition: form-data; name='upload'; filename='" + file.name + "'\r\n";  
				body += "Content-Type: application/octet-stream\r\n\r\n";  
				body += binary + "\r\n";  
				body += '--' + boundary + '--';      
				xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
				
				// Bind onReadyStateChange function to XHR
				xhr.onreadystatechange = function()	{ upload.sendToServerState(this, file);	}
				
				xhr.sendAsBinary(body); 
			} 
			// Case for Chrome Browser
			else
            {
            	xhr.open('POST', self.server_file + '?up=true&base64=true', true);
            	xhr.setRequestHeader('UP-FILENAME', file.name);
            	xhr.setRequestHeader('UP-SIZE', file.size);
            	xhr.setRequestHeader('UP-TYPE', file.type);
            	xhr.send(window.btoa(binary));
            	xhr.onreadystatechange = function() { upload.sendToServerState(this, file);    }
            }
			
			// Show preview of upload image
			if (self.options.show_preview)
			{
				self.imagePreview(file);
			}
				
		}

		/**
		 * File read progress display if status placeholder is defined in options
		 * @param Object event
		 */
		this.readerLoadProgress = function(event)
		{
			status = (self.options.status_placeholder) ? document.getElementById(self.options.status_placeholder) : null;
			if (status)
			{
				if (event.lengthComputable) {
					var percentage = Math.round((event.loaded * 100) / event.total);
					status.innerHTML = 'Loaded : '+percentage+'%';
				}
			}
		}
		
		/**
		 * File read error
		 * @param Object event 
		 * @throws 'File_not_found'
		 * @throws 'File_not_readable'
		 * @throws 'File_upload_abort'
		 * @throws 'File_read_error'
		 */
		this.readerLoadError = function(event)
		{
			try {
				switch(event.target.error.code) {
					case event.target.error.NOT_FOUND_ERR:
						throw 'File_not_found';
					break;
					case event.target.error.NOT_READABLE_ERR:
						throw 'File_not_readable';
					break;
					
					case event.target.error.ABORT_ERR:
						throw 'File_upload_abort';
					break; 
					default:
						throw 'File_read_error';
					break;
				}
			}	
			catch (Error)
			{
				self.error(Error);
			}
			
		}	

		// Saves "this" for other object namespaces
		var upload = this;
		
		// Check file type, throw error if file is incorrect
		if (!this.options.ignore_invalid_files_types)
		{
			try 
			{
				if (!self.isCorrectFileType(file))
				{
					throw 'Incorrect_file_type';
				}	
			}
			catch (Error)
			{
				self.error(Error);
			}
		}
		
		// Add the ability to use user define onLoadStart function
		if (self.options.onLoadStart)
		{
			self.options.onLoadStart(file);
		}
	
		
		// Upload version for: Firefox 3.6, Chrome 6, WebKit
		if (window.FileReader) { 
					
			var reader = new FileReader();
			
			if (reader.addEventListener) {
				// Add event listeners for Firefox 3.6, WebKit
				reader.addEventListener('loadend', upload.readerLoadEnd, false);
				if (this.options.onLoadError) 
				{
					reader.addEventListener('error', this.options.onLoadError, false); 
				}
				else
				{
					reader.addEventListener('error', upload.readerLoadError, false);
				}
				if (this.options.onLoadProgress) 
				{
					reader.addEventListener('progress', this.options.onLoadProgress, false);
				} 
				else
				{
					reader.addEventListener('progress', upload.readerLoadProgress, false);
				}
						
			} else {
				// Simple overwrite standard reader function for Google Chrome
				reader.onloadend = upload.readerLoadEnd;
				if (this.options.onLoadError)
				{
					reader.onerror = this.options.onLoadError;
				}
				else
				{
					reader.onerror = upload.readerloadError;
				}
				if (this.options.onLoadProgress)
				{
					reader.onprogress = this.options.onLoadProgress;
				}
				else
				{
					reader.onprogress = upload.readerLoadProgress;	
				}
			}
			
			// Reader read file as binary string
	     	reader.readAsBinaryString(file);
		}	
		else
		{
			// Safari don't support FileReader but file can be sended by simple XHR
			self.XHRSimpleSend(file);
			
		}
		
	}
	
	/**
	 * Drop on html DOM element
	 * @param Object event
	 * @throws No_dataTransfer
	 */
	this.drop = function(event)
	{
		event.preventDefault();
		try
		{
			if (!event.dataTransfer)
			{
				throw 'No_dataTransfer';
			}
		}
		catch (Error)
		{
			this.error(Error);
		}
		var dataTransfer = event.dataTransfer;
	 	var files = dataTransfer.files;
	 	
	 	// Send only first from droped files list
	 	if (self.options.send_simple_one)
	 	{
	 		var file = files[0];
	 		self.upload(file);
	 	}
	 	else
	 	{
	 		// Send file one by one
		 	if (self.options.send_queued)
		 	{
		 		self.files = files;
		 		self.file_id = 0;
		 		self.upload(files[0]);
		 	}
		 	// Send all files at one time 
		 	else
		 	{
			 	for (var i = 0; i<files.length; i++) 
			 	{
					var file = files[i];
					self.upload(file);
			 	}
		 	}
	 	}
	}
	
	/**
	 * Check file extension 
	 * @param Object file
	 * @return Boolean
	 */
	this.isCorrectFileType = function(file)
	{
		var file_info = file.type.split('/');
		var i;
		for (i=0;i<self.options.files_types.length;i++)
		{
			if (self.options.files_types[i] == file_info[1])
			{
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Drag over html DOM element 
	 * @param Object event 
	 */
	this.drag = function(event)
	{
		event.stopPropagation(); 
		event.preventDefault();
	}
	
	/**
	 * Drag over the drop field action
	 */
	this.dragenter = function(event)
	{
		if (self.options.onDropOver)
		{
			self.options.onDropOver();
		}
	}
	
	/**
	 * Drag exit the drop filed action
	 */
	this.dragexit = function(event)
	{
		if (self.options.onDropOut)
		{
			self.options.onDropOut();
		}
	}
	
	/**
	 * Display errors occuring in script work
	 * @param String error
	 */
	this.error = function(error)
	{
		switch(error)
		{
			case 'No_object':
				document.write('No html object selected for HTML5Uploader');
			break;
			case 'No_server_file':
				document.write('No server site script selected for HTML5Uploader');
			break;
			case 'No_dataTransfer':
				if (!this.options.ignore_invalid_browsers)
				{
					document.write('Browser doesn\'t allow data transfer action');	
				}
			break;
			case 'File_read_error':
				document.write('File read error');
			break;
			case 'File_upload_abort':
				document.write('File upload abort');
			break;
			case 'File_not_readable':
				docuemnt.write('File not readable');
			break;
			case 'File_not_found':
				document.write('File not found');
			break;
			case 'Incorrect_file_type':
				document.write('File type is incorrect');
			break;
			
		}
	}
	
	/**
	 * Additional file input change action; bind user onFileInputChange function to selected input type file
	 */
	this.fileInputChange = function()
	{
		var has_changed = false;
		if (!self.input_file_value)
		{ 
			self.input_file_value = this.value;
			has_changed = true;
		}
		else 
		{
			if (self.input_file_value != this.value)
			{
				self.input_file_value = this.value;
				has_changed = true;
			}
		}
		
		if (self.options.onFileInputChange && has_changed)
		{
			self.options.onFileInputChange(this);
		}	
	}
	
	/**
	 * Bind onchange event to specyfied file input field
	 * If was specyfied input_file_value then clear that attribute
	 */
	this.bindFileInputChangeEvent = function()
	{
		if (this.input_file_value)
		{
			this.input_file_value = null;
		}
		if (this.options.input_file)
		{
			this.input_file = document.getElementById(this.options.input_file);
			
			this.addEvent(this.input_file, "change", this.fileInputChange, false);
			
		}
	}
	/**
	 * Attach or addEventListener function
	 * @param Object object
	 * @param String type
	 * @param Object listener
	 * @param Boolean useCapture
	 */
	this.addEvent = function(object, type, listener, useCapture)
	{
		if (window.addEventListener)
		{
			object.addEventListener(type, listener, useCapture);
		}
		else
		{
			object.attachEvent(type, listener);
		}
	}
	
	/**
	 * Constructor loads options and standard class configuration
	 * and add event listeners for dragover and drop browser events
	 * 
	 * @throws No_object
	 * @throws No_server_file
	 */
	this.options = (options) ? options : null;

	try {
		if (!html_object_id)
		{
			throw 'No_object';
		}
		this.html_object = document.getElementById(html_object_id);
		if (!this.html_object)
		{
			throw 'No_object';
		}
		
		if (!server_file) 
		{
			throw 'No_server_file';
		}
		this.server_file = server_file;		
	}
	catch (Error)
	{
		this.error(Error);
	}
	
	// Add JS object to scope over all events (so "this" is prevented before overwritting)
	var self = this;
	
	// Add extra actions for selected input file
	this.bindFileInputChangeEvent();
	
	// Add files extensions filter
	if (!this.options.files_types)
	{
		this.options.files_types = ['png', 'gif', 'jpg', 'jpeg', 'tiff'];
	}
	
	// Add main event listeners
	self.addEvent(this.html_object, "dragover", this.drag, true);
	self.addEvent(this.html_object, "drop", this.drop, true);
	self.addEvent(this.html_object, "dragenter", this.dragenter, true);
	self.addEvent(this.html_object, "dragexit", this.dragexit, true);
	
	// Fire user define onCreate function
	if (this.options.onCreate)
	{
		this.options.onCreate(this);
	}

}




	