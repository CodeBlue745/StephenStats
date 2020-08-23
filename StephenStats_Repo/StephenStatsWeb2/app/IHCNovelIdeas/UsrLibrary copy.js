/**
 * 
 */	vm.checkUserRole = checkUserRole;
 
 	function checkPatientExists(){
 		vm.validatemrnadt = checkUserRole();
 		/*if ( && vm.validatemrnadt){
 			
 		}*/
 	}

	function checkUserRole(){
		//vm.isAdmin = $rootScope.globals.currentUser.adminflag ? true : false;
		vm.isAdmin = false;
		if (vm.isAdmin === true) {
			vm.role = 'Admin';
			return true;
		}
		else if (vm.isAdmin === false){
			vm.role = 'User';
			return false;
		}
		/*This feature can be integrated if necessary.
		else if (vm.isAdmin === "HomeCare"){
			vm.role = "Homecare";
			return true;
		}*/
		else if (vm.userRole.MISSING()){
			vm.role = "Missing";
			console.log("User's role is missing!");
			return false;
		}
		else{//There is no need for an undefined if/else case with an else statement.
			return false;
		}
	}
	
	