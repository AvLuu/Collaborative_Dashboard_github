var variableName = "current_attempt_count"

//initializations (do not touch)
var detector_output = {name: variableName,
						category: "Dashboard", 
						value: 0,
						history: {},
						skill_names: "",
						step_id: "",
						transaction_id: "",
						time: ""
						};
var mailer;

//initialize any custom global variables for this detector here
var prevStep = ""

function receive_transaction( e ){
	//e is the data of the transaction from mailer from transaction assembler

	//TEST CODE
	console.log("in detector1 with data:");
	console.log(e.data);

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
		currStep = e.data.tool_data.selection

		if(currStep in detector_output.history){
			//update detector output accordingly
			detector_output.history[currStep] += 1;
			detector_output.value = detector_output.history[currStep];
		}
		else{
			//update detector output accordingly
			detector_output.history[currStep] = 1;
			detector_output.value = 1;
		}

	}

	//set conditions under which detector should update
	//external state and history
	if(e.data.actor == 'student' && e.data.tool_data.action != "UpdateVariable"){
		detector_output.time = new Date();
		detector_output.transaction_id = e.data.transaction_id;
		mailer.postMessage(detector_output);
		postMessage(detector_output);
		console.log("output_data = ", detector_output);
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
	case "initialize":
		for (initItem in e.data.initializer){
			if (e.data.initializer[initItem].name == variableName){
				detector_output.history = e.data.initializer[initItem].history;
				detector_output.value = e.data.initializer[initItem].value;
			}
		}

		//optional: Below, specify conditions under which a detector
		//should NOT remember their most recent value and history (using the variable "detectorForget"). 
		//(e.g., setting the condition to "true" will mean that the detector 
		// will always be reset between problems... and setting the condition to "false"
		// means that the detector will never be reset between problems)
		//
		//
		//
		detectorForget = true;

		if (detectorForget){
			detector_output.history = "";
			detector_output.value = 0;
		}
	break;
    default:
	break;
    }
}

