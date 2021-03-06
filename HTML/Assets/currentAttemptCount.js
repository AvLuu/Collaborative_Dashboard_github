var variableName = "current_attempt_count"


//initializations (do not touch)
// when a session starts
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

	// In CTAT, detectors will generate their own transactions.
	// therefore, this line checks whether it concerns an actual student action
	// and not from its own messages or its own updates
	// You could make these conditions more specific for specific transactions
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

		//find the current step
		currStep = e.data.tool_data.selection

    // if the step was already encountered, it means the attemptcount
		// must be incremented by 1
		if(currStep in detector_output.history){
			//update detector output accordingly
			detector_output.history[currStep] += 1;
			detector_output.value = detector_output.history[currStep];
		}
		// if it is the first attempt, set the value to 1
		else{
			//update detector output accordingly
			detector_output.history[currStep] = 1;
			detector_output.value = 1;
		}

	}

	//set conditions under which detector should update
	//external state and history
	if(e.data.actor == 'student' && e.data.tool_data.action != "UpdateVariable"){
    // update the time at which it was sent
		detector_output.time = new Date();
		// and set a transaction ID so that you can look up which transaction
		// generated it
		detector_output.transaction_id = e.data.transaction_id;
		// sending the result to tutorshop, upon which it can go to the dashboard
		mailer.postMessage(detector_output);
		postMessage(detector_output);
		console.log("output_data = ", detector_output);
	}
}

// this section is updated in the NEWer version
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
