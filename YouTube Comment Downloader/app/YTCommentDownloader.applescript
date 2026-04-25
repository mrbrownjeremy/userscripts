-- Handles ytcomments://download?url=<encoded>&sort=<0|1>&limit=<n>
-- Triggered by Tampermonkey button via custom URL scheme

on open location theURL
	set videoURL to extractParam(theURL, "url")
	if videoURL is "" then
		display notification "No URL found in request" with title "YouTube Comment Downloader"
		return
	end if

	set sortVal to extractParam(theURL, "sort")
	if sortVal is "" then set sortVal to "0"

	set limitVal to extractParam(theURL, "limit")
	set titleVal to extractParam(theURL, "title")

	set scriptPath to (POSIX path of (path to home folder)) & "bin/download-yt-comments"

	set cmd to "/bin/bash -l " & quoted form of scriptPath & " " & quoted form of videoURL & " " & quoted form of sortVal & " " & quoted form of limitVal & " " & quoted form of titleVal

	-- Run in background so AppleScript doesn't block or time out on large downloads
	-- The shell script itself shows a notification when done
	do shell script cmd & " >> /tmp/ytdl.log 2>&1 &"
end open location

on extractParam(theURL, paramName)
	set searchStr to paramName & "="
	if theURL does not contain searchStr then return ""
	set AppleScript's text item delimiters to searchStr
	set parts to text items of theURL
	set encoded to item 2 of parts
	set AppleScript's text item delimiters to ""
	if encoded contains "&" then
		set AppleScript's text item delimiters to "&"
		set encoded to item 1 of text items of encoded
		set AppleScript's text item delimiters to ""
	end if
	return do shell script "python3 -c 'import sys,urllib.parse; print(urllib.parse.unquote(sys.argv[1]))' " & quoted form of encoded
end extractParam
