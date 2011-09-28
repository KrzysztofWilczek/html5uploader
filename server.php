<?php
/**
 * Move uploaded files to selected directory. 
 * @author Krzysztof Wilczek
 * @return JSON
 */
$upload_folder = 'files';  
      
if(count($_FILES)>0) 
{ 
	// For browser with supported sendAsBinary()
	if( move_uploaded_file( $_FILES['upload']['tmp_name'] , $upload_folder .'/'. $_FILES['upload']['name'] ) ) {
		$file_name = $_FILES['upload']['name'];
	}

} 
else if(isset($_GET['up'])) 
{
	if(isset($_GET['base64'])) {
		$content = base64_decode(file_get_contents('php://input'));
	} else {
		$content = file_get_contents('php://input');
	}
			
	$headers = getallheaders();
	$headers = array_change_key_case($headers, CASE_UPPER); //different case was being used for different browsers

	if(file_put_contents($upload_folder.'/'.$headers['UP-FILENAME'], $content)) {
		$file_name = $headers['UP-FILENAME'];
	}		
}
		
if (empty($file_name))
{
	echo json_encode(array('success' => false));
}

$path = $upload_folder .'/'. $file_name;		
		
echo json_encode(array('success' => true, 'path' => $path));
?>  