//detector template

importScripts('diff.js');

//add output variable name below
var variableName = "lynnette_error_category_frequency"

//initializations (do not touch)
var detector_output = {name: variableName,
						category: "Dashboard", 
						value: {},
						history: "",
						skill_names: "",
						step_id: "",
						transaction_id: "",
						time: ""
						};
var mailer;

//initialize any custom global variables for this detector here
var prevStep = "";
var prevEq = "";
var currRow = 1;
var currLeftCorrect = 0;
var currRightCorrect = 0;
var currLeft = "_______";
var currRight = "_______";

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

//standard canonicalization
function canonicalize(str){
	var letters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
	var mapping = {};
	var letterCounter = 0;
	var skipLength = 0;
	var currNum = 0;
	var pieces = str.split("->");

	str = pieces[0].replace(/\s+/g, '') + " -> " + pieces[1].replace(/\s+/g, '');


	for (var i = 0, len = str.length; i < len; i++) {
  		if (isNumeric(str[i])){

  			//find out how long the number is
  			skipLength=0;
  			while (true){
  				console.log("isNumeric",str[i+1+skipLength],isNumeric(str[i+1+skipLength]));
  				if (!isNumeric(str[i+1+skipLength])){
  					break;
  				}
  				else{
  					skipLength += 1;
  				}
  			}

  			currNum = str.substring(i,i+skipLength+1);

			if (currNum in mapping){
				str = str.substring(0,i) + mapping[currNum] + str.substring(i+1+skipLength);
			}
			else{
				mapping[currNum] = letters[letterCounter];
				letterCounter += 1;
				str = str.substring(0,i) + mapping[currNum] + str.substring(i+1+skipLength);
			}
			i=i+skipLength-1;
		}
	}
	return str;
}

//change-based canonicalization (uses canonicalize for the first step)
//
// utilizes kpdecker's jsdiff library
//
// e.g.,
// x + 6 = 15 -> x + 6 - 6 = 15    would become    ... - a = ...
//
// x + 6 = 15 -> 6 = 15     would become    remove(x) ... = ...
//
// TO-DO: ....must re-do letter mapping portion of canoncalization here
function changeBasedCanonicalize(str){
	var canonicalized = canonicalize(str);
	var pieces = canonicalized.split("->");
	var diff = JsDiff.diffWords(pieces[0].replace(/\s+/g, ''), pieces[1].replace(/\s+/g, ''));
	var outStr = "";

	diff.forEach(function(part){
		if (part.added){
			outStr = outStr + part.value;
		}
		else if (part.removed){
			outStr = outStr + "[" + part.value + "]";
		}
		else{
			console.log(part.value)
			if (part.value == " " || part.value == "=" || part.value == " = "){
				outStr = outStr + part.value;
			}
			else{
				outStr = outStr + "...";
				if (part.value.includes("=")){
					outStr = outStr + "=";
				}
			}
		}
	})
	console.log(outStr)

	return outStr;
}

function trackChanges(str){
	var canonicalized = canonicalize(str);
	var pieces = str.split("->");
	var diff = JsDiff.diffWords(pieces[0], pieces[1]);
	var outStr = "";

	diff.forEach(function(part){
		if (part.added){
			outStr = outStr + "^" + part.value + "^";
		}
		else if (part.removed){
			outStr = outStr + "[" + part.value + "]";
		}
		else{
			if (part.value == " " || part.value.includes("=") || part.value.includes("+") || part.value.includes("-")){
				outStr = outStr + part.value;
			}
			else{
				outStr = outStr + "...";
			}
		}
	})
	console.log(outStr)

	return outStr;
}


// standard + infer operation canonicalization (i.e., if a number turns out to be a simple function of other numbers
// in the prev equation... then write the function [guess 'most likely' based on historical data, to break ties 
// when multiple match])
//
//
//


// labeled error categories
//
//
//
//
//



//TO-DO: 
// detector initialiization, and leave comment
// showing user how not to initialize (or, if we decide to
// initialize all detector variables by default, at startup...
// I suppose this would mean showing user how to clear initialized
// values upon the first transaction received?)


function receive_transaction( e ){
	//e is the data of the transaction from mailer from transaction assembler

	//set conditions under which transaction should be processed 
	//(i.e., to update internal state and history, without 
	//necessarily updating external state and history)
	if(e.data.actor == 'student' && e.data.tool_data.action != "UpdateVariable"){
		//do not touch
		rawSkills = e.data.tutor_data.skills
		var currSkills = []
		for (var property in rawSkills) {
		    if (rawSkills.hasOwnProperty(property)) {
		        currSkills.push(rawSkills[property].name + "/" + rawSkills[property].category)
		    }
		}
		detector_output.skill_names = currSkills;
		detector_output.step_id = e.data.tutor_data.step_id;

		//custom processing (insert code here)
		if (e.data.tool_data.selection.includes("solve")){

			//to-do: generalize so that this works with the undo button
			if (e.data.tool_data.selection == "solveLeft" + currRow && e.data.tutor_data.action_evaluation.toLowerCase() == "correct"){
				currLeftCorrect = 1;
			}
			if (e.data.tool_data.selection == "solveRight" + currRow && e.data.tutor_data.action_evaluation.toLowerCase() == "correct"){
				currRightCorrect = 1;
			}
			if (currLeftCorrect==1 && currRightCorrect==1){
				currRow += 1;
				currLeftCorrect = 0;
				currRightCorrect = 0;
				prevEq = currLeft + " + " + currRight;
				currLeft = "_______";
				currRight = "_______";
			}

			if (e.data.tutor_data.selection.includes("solveLeft")){
					currLeft = e.data.tool_data.input;
			}
			if (e.data.tutor_data.selection.includes("solveRight")){
					currRight = e.data.tool_data.input;
			}

			if (e.data.tutor_data.selection.includes(String(currRow)) && e.data.tutor_data.action_evaluation.toLowerCase() == "incorrect"){

				if (prevEq == ""){
					//would be ideal to change this to something more robust... specifically:
					//would be nice if we could access varables from tutor state (variable table...)
					prevEq = e.data.context.problem_name.replace(" ", " + ").replace("eq", " = ");
					//"-x 6eq15"
				}

				//this part obviously needs to be expanded...
				currError = currLeft + " = " + currRight;
				
				canonicalizedTransition = changeBasedCanonicalize(prevEq + "  ->  " + currError);

				if (canonicalizedTransition in detector_output.value){
					detector_output.value[canonicalizedTransition] += 1;
				}
				else{
					detector_output.value[canonicalizedTransition] = 1;
				}

			}
		}
	}

	//set conditions under which detector should update
	//external state and history
	if(e.data.actor == 'student' && e.data.tool_data.action != "UpdateVariable" && e.data.tutor_data.action_evaluation.toLowerCase() == "incorrect"){
		detector_output.time = new Date();
		detector_output.transaction_id = e.data.transaction_id;
		mailer.postMessage(detector_output);
		postMessage(detector_output);
		console.log("output_data = ", detector_output);
		console.log("output_data value = ", JSON.stringify(detector_output.value))
	}
}


self.onmessage = function ( e ) {
    console.log(variableName, " self.onmessage:", e, e.data, (e.data?e.data.commmand:null), (e.data?e.data.transaction:null), e.ports);
    switch( e.data.command )
    {
    case "connectMailer":
	mailer = e.ports[0];
	mailer.onmessage = receive_transaction;
	break;
    default:
	break;
    }
}