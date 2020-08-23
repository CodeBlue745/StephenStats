/**
 * Created by skatrag1 on 10/21/2016.
 */

'use strict';

angular.module('roms.classification', ['roms.datepicker','ui.bootstrap']).component('classificationComponent', {
    templateUrl: 'scripts/components/classification/classification.template.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
    controller: ClassificationComponentController
});

ClassificationComponentController.$inject = ['$rootScope', '$moment', 'classificationservice', '$window', '$uibModal', '$log'];

function ClassificationComponentController($rootScope, $moment, classificationservice, $window, $uibModal, $log) {
    var ctrl = this;
    var bodyArea = '';
    var type = '';
    var msprId = -1;

    if($rootScope.globals !== undefined && $rootScope.globals.currentUser !== undefined && $rootScope.globals.currentUser.msprId !== undefined){
        msprId = Number($rootScope.globals.currentUser.msprId);
    }

    ctrl.cancel = cancel;
    ctrl.calculateChronicPainStatus = calculateChronicPainStatus;
    ctrl.checkFormValid = checkFormValid;
    ctrl.checkDateValid = checkDateValid;
    ctrl.deleteClassification = deleteClassification;
    ctrl.openDeleteClassificationModal = openDeleteClassificationModal;
    ctrl.reset = reset;
    ctrl.saveClassification = saveClassification;
    ctrl.treatmentCategoryChange = treatmentCategoryChange;

    var admitId = ctrl.resolve.items.admitId;
    if (ctrl.resolve.items.classification !== undefined) {
        ctrl.classification = ctrl.resolve.items.classification;
        ctrl.editFlag = true;
        ctrl.showClassificationOption = true;
        var treatmentType = '';
        if (ctrl.classification.treatmentType.toUpperCase() === 'CONSERVATIVE' || ctrl.classification.treatmentType.toUpperCase() === 'NON-SURGICAL') {
            treatmentType = 'NONSURGICAL';
        }else if(ctrl.classification.treatmentType.toUpperCase() === 'TRAUMATIC') { 
            treatmentType = 'TRAUMATIC';
        }else if(ctrl.classification.treatmentType.toUpperCase() === 'NON-TRAUMATIC') { 
            treatmentType = 'NONTRAUMATIC';
        }else if(ctrl.classification.bodyArea.toUpperCase() === 'LYMPHEDEMA') { 
            treatmentType = 'ORIGINAL';
        }else if(ctrl.classification.bodyArea.toUpperCase() === 'TORTICOLLIS') { 
            treatmentType = 'NONSURGICAL';
        }else if(ctrl.classification.bodyArea.toUpperCase() === 'LYMPHEDEMA SECONDARY') { 
            treatmentType = 'SECONDARY';
        }else if(ctrl.classification.treatmentType.toUpperCase() === 'TRANSPLANT') { 
            treatmentType = 'TRANSPLANT';
        }else if(ctrl.classification.treatmentType.toUpperCase() === 'NON TRANSPLANT') { 
            treatmentType = 'NON TRANSPLANT';
        }else {
            treatmentType = 'SURGICAL';
        }
        
        
        if (ctrl.classification.bodyArea.toUpperCase() === 'LUMBAR') {
            ctrl.classification.symptoms = ctrl.classification.symptomsDttkFlg;
        }
       /* if (ctrl.classification.bodyArea.toUpperCase() === 'HIP') {
            ctrl.classification.hipSurgeryNo = String(ctrl.classification.involvedHipSurgeryNo);
            ctrl.classification.hipRevisionNo = String(ctrl.classification.involvedHipRevisionNo);
            if(ctrl.classification.hipSurgeryNo === '10') {
                ctrl.classification.hipSurgeryNo = '10+';
            }
            if(ctrl.classification.hipRevisionNo === '3') {
                ctrl.classification.hipRevisionNo = '3+';
            }
        }*/
        ctrl.classification.treatmentCategory = ctrl.classification.bodyArea.toUpperCase() + '-' + treatmentType;
        console.log(ctrl.classification.previousEpisodesCount);
        ctrl.classification.previousEpisodesCount = String(ctrl.classification.revisionNo);
        if(ctrl.classification.previousEpisodesCount === '10') {
            ctrl.classification.previousEpisodesCount = '10+';
        }
        ctrl.classification.classId = String(ctrl.classification.classId);
        if (ctrl.classification.surgeryDate !== undefined && ctrl.classification.surgeryDate !== null) {
            ctrl.classification.surgeryDate = $moment(ctrl.classification.surgeryDate, 'MM/DD/YYYY')._d;
        }
        if (ctrl.classification.injuryDate !== undefined && ctrl.classification.injuryDate !== null) {
            ctrl.classification.injuryDate = $moment(ctrl.classification.injuryDate, 'MM/DD/YYYY')._d;
        }
		if ( ctrl.classification.transplantDate !== undefined &&  ctrl.classification.transplantDate !== null) {
        	 ctrl.classification.transplantDate = $moment( ctrl.classification.transplantDate, 'MM/DD/YYYY')._d;
        }
       
        ctrl.treatmentCategoryChange();
        if (ctrl.classification.chronicPain === 'yes') {
            ctrl.classification.duration = '3';
            ctrl.classification.frequency = '2';
        } else {
            ctrl.classification.duration = '1'; // default to less than 1 month
        }
        ctrl.calculateChronicPainStatus();

    } else {
        ctrl.classification = {};
        ctrl.classification.primaryClassification = 'yes';
        ctrl.classification.torticollisClassification = 'yes';
        ctrl.classification.surgeryDate = new Date();
        ctrl.classification.injuryDate = new Date();
        ctrl.classification.transplantDate = new Date();
        ctrl.editFlag = false;
        ctrl.showClassificationOption = false;
        ctrl.chronicPainStatusMessage = '';
        ctrl.isNonTraumatic = true;
        ctrl.isSurgical = false;
        ctrl.isLumbar = false;
        ctrl.isHip = false;
        ctrl.isLymphedemaSecondary = false;
        ctrl.isLymphedema = false;
        ctrl.isTransplant = false;
        ctrl.isNonTransplant = false;
        ctrl.classification.hipSurgeryNo = null;
        ctrl.classification.hipRevisionNo = null;
        ctrl.isAll = false;
        ctrl.isTraumatic = false;          
        ctrl.classification.previousEpisodesCount = '0';
        
    }

    ctrl.previousEpisodesOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];
    ctrl.hipRevisionOptions = ['0', '1', '2', '3+'];

    ctrl.treatmentCategories = [		
		{id: 'AMPUTATION BILATERAL-NONTRAUMATIC', name: 'Amputation Bilateral Non-Traumatic'},
		{id: 'AMPUTATION BILATERAL-TRAUMATIC', name: 'Amputation Bilateral Traumatic'}, 
		{id: 'AMPUTATION UNILATERAL-NONTRAUMATIC', name: 'Amputation Unilateral Non-Traumatic'},
		{id: 'AMPUTATION UNILATERAL-TRAUMATIC', name: 'Amputation Unilateral Traumatic'},  
        {id: 'BRAIN-SURGICAL', name: 'Brain Surgical'},
		{id: 'BRAIN-NONSURGICAL', name: 'Brain Non-Surgical'}, 
		{id: 'CANCER/TUMOR-TRANSPLANT', name: 'Cancer/Tumor Transplant'},
        {id: 'CANCER/TUMOR-NON TRANSPLANT', name: 'Cancer/Tumor Non-Transplant'},
		{id: 'CANCER/TUMOR-SURGICAL', name: 'Cancer/Tumor Surgical'},
        {id: 'CANCER/TUMOR-NONSURGICAL', name: 'Cancer/Tumor Non-Surgical'},
        {id: 'CERVICAL-SURGICAL', name: 'Cervical Surgical'},
        {id: 'CERVICAL-NONSURGICAL', name: 'Cervical Non-Surgical'},
        {id: 'ELBOW-SURGICAL', name: 'Elbow Surgical'},
        {id: 'ELBOW-NONSURGICAL', name: 'Elbow Non-Surgical'},
        {id: 'FOOT/ANKLE-SURGICAL', name: 'Foot/Ankle Surgical'},
        {id: 'FOOT/ANKLE-NONSURGICAL', name: 'Foot/Ankle Non-Surgical'},
        {id: 'HAND-SURGICAL', name: 'Hand Surgical'},
        {id: 'HAND-NONSURGICAL', name: 'Hand Non-Surgical'},
        {id: 'HIP-SURGICAL', name: 'Hip Surgical'},
        {id: 'HIP-NONSURGICAL', name: 'Hip Non-Surgical'},
        {id: 'KNEE-SURGICAL', name: 'Knee Surgical'},
        {id: 'KNEE-NONSURGICAL', name: 'Knee Non-Surgical'},
        {id: 'LUMBAR-SURGICAL', name: 'Lumbar Surgical'},
        {id: 'LUMBAR-NONSURGICAL', name: 'Lumbar Non-Surgical'}, 
        {id: 'LYMPHEDEMA-ORIGINAL', name: 'Lymphedema'},
        {id: 'LYMPHEDEMA SECONDARY-SECONDARY', name: 'Lymphedema Secondary'},
        {id: 'NEURO-SURGICAL', name: 'Neuro Surgical'},
        {id: 'NEURO-NONSURGICAL', name: 'Neuro Non-Surgical'}, 
        {id: 'PELVIC HEALTH-SURGICAL', name: 'Pelvic Health Surgical'},
        {id: 'PELVIC HEALTH-NONSURGICAL', name: 'Pelvic Health Non-Surgical'},
        {id: 'SHOULDER-SURGICAL', name: 'Shoulder Surgical'},
        {id: 'SHOULDER-NONSURGICAL', name: 'Shoulder Non-Surgical'},
        {id: 'THORACIC-SURGICAL', name: 'Thoracic Surgical'},
        {id: 'THORACIC-NONSURGICAL', name: 'Thoracic Non-Surgical'},
        {id: 'TORTICOLLIS-NONSURGICAL', name: 'Torticollis'},
        {id: 'WRIST-SURGICAL', name: 'Wrist Surgical'},
        {id: 'WRIST-NONSURGICAL', name: 'Wrist Non-Surgical'}];

    ctrl.durationPainSymptoms = [{id: 1, duration: 'Less than 1 month or no pain'}, {id: 2, duration: '1-3 months'}, {
        id: 3,
        duration: 'More than 3 months'
    }];

    ctrl.frequencies = [{id: 1, frequency: 'Less than half the days'}, {
        id: 2,
        frequency: 'Half the days or more than half the days'
    }];

    function cancel() {
        ctrl.dismiss({$value: 'cancel'});
    }

    function calculateChronicPainStatus() {
        if (Number(ctrl.classification.duration) > 0) {
            if (Number(ctrl.classification.duration) === 3){
                ctrl.showFrequencies = true;
            }else {
                ctrl.showFrequencies = false;
            }
            var painLevel = '';
            if (Number(ctrl.classification.duration) === 3 && Number(ctrl.classification.frequency) === 2) {
                painLevel = 'CHRONIC';
                ctrl.classification.chronicPain = 'yes';
            } else {
                painLevel = 'ACUTE';
                ctrl.classification.chronicPain = 'no';
            }
            ctrl.chronicPainStatusMessage = 'Pain: ' + painLevel;
        } else {
            ctrl.chronicPainStatusMessage = '';
        }
    }
    
    function checkFormValid() {
        if (ctrl.classification.treatmentCategory !== undefined &&
            ctrl.classification.classId !== undefined &&
            ctrl.classification.previousEpisodesCount !== undefined &&
            ctrl.classification.primaryClassification !== undefined &&
            ctrl.classification.duration !== undefined) {

           /* if(bodyArea === 'HIP' && type === 'SURGICAL' &&
                (ctrl.classification.hipSurgeryNo === null || ctrl.classification.hipRevisionNo === null)) {
                return false;
            }*/
            if (bodyArea === 'LUMBAR' && ctrl.classification.symptoms === undefined) {
                return false;
            }
            return true;
        }
        return false;
    }

    function checkDateValid() {
    	 var result = ctrl.classification.treatmentCategory.split('-');
         bodyArea = result[0];
        if(type === 'SURGICAL' && ctrl.classification.surgeryDate <= new Date() && ctrl.classification.surgeryDate !== null){
            return true;
        }

        if((type === 'ALL' || type === 'NONSURGICAL' || type === 'NONTRAUMATIC' || type === 'TRAUMATIC') && ctrl.classification.injuryDate <= new Date() && ctrl.classification.surgeryDate !== null) {
            return true;
        }
        
        if (bodyArea === 'LYMPHEDEMA' || bodyArea === 'LYMPHEDEMA SECONDARY' || bodyArea === 'TORTICOLLIS' || type === 'NON TRANSPLANT') {
          return true;
		}
        
        if (type === 'TRANSPLANT' && ctrl.classification.injuryDate <= new Date()) {
            return true;
        }
        
    	else{
            if (ctrl.classification.injuryDate > new Date()) {
            	ctrl.form.injuryDate.$error.date = true;
            	return false;
        		}
    	return false;
    	}
    }
    
    function openDeleteClassificationModal(classificationId) {
        ctrl.modalText = 'classification';
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'alertComponent',
            windowClass: 'delete-modal',
            backdropClass: 'delete-modal-backdrop',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        modalText: ctrl.modalText
                    };
                }
            }
        });

        modalInstance.result.then(function (result) {
            if(result){
                ctrl.deleteClassification(classificationId);
            }
        }, function () {
            $log.info('Alert modal dismissed at: ' + new Date());
        });
    }

    function deleteClassification(classificationId) {
        classificationservice.deleteClassification(classificationId, msprId)
            .then(function (data) {
                ctrl.close({$value: admitId});
            });
    }

    function reset() {
        if (ctrl.form) {
            ctrl.form.$setPristine();
            ctrl.form.$setUntouched();
        }
        ctrl.classification = {};
        ctrl.classification.injuryDate = new Date();
        ctrl.classification.transplantDate = new Date();
        ctrl.classification.surgeryDate = new Date();
    }

    function saveClassification() {
    	 $log.info('saveClassification');
        if (ctrl.checkFormValid() && ctrl.checkDateValid()) {
        	 $log.info('saveClassification if');
            var newClassification = {};
            newClassification.classificationId = ctrl.classification.classificationId;
            newClassification.classId = Number(ctrl.classification.classId);
            newClassification.admitId = admitId;
            if(ctrl.classification.previousEpisodesCount === '10+') {
                ctrl.classification.previousEpisodesCount = '10';
            }
            newClassification.revisionNo = Number(ctrl.classification.previousEpisodesCount);
            newClassification.primaryClassification = ctrl.classification.primaryClassification;
            newClassification.chronicPain = ctrl.classification.chronicPain;
            newClassification.torticollisClassification= ctrl.classification.torticollisClassification;
            if (type === 'SURGICAL') {
                newClassification.surgeryDate = $moment(ctrl.classification.surgeryDate).format('YYYY-MM-DD');
            } else {
                newClassification.injuryDate = $moment(ctrl.classification.injuryDate).format('YYYY-MM-DD');
            }

			if (type === 'TRANSPLANT') {
                newClassification.transplantDate = $moment(ctrl.classification.transplantDate).format('YYYY-MM-DD');
            }

            if (bodyArea === 'LUMBAR') {
                newClassification.symptomsDttkFlg = ctrl.classification.symptoms;
            }

           /* if(bodyArea === 'HIP' && type === 'SURGICAL') {
                if(ctrl.classification.hipSurgeryNo === '10+') {
                    ctrl.classification.hipSurgeryNo = '10';
                }
                if(ctrl.classification.hipRevisionNo === '3+') {
                    ctrl.classification.hipRevisionNo = '3';
                }
                newClassification.involvedHipSurgeryNo = Number(ctrl.classification.hipSurgeryNo); 
                newClassification.involvedHipRevisionNo = Number(ctrl.classification.hipRevisionNo);
            } */

            classificationservice.saveClassification(newClassification, msprId)
                .then(function (data) {
                    if (data instanceof Error) {
                        ctrl.showMessage = true;
                        if (data.message === 'PRIMARY_CLASSIFICATION_EXISTS') {
                            ctrl.message = 'Error saving classification, You already have a primary classification ' +
                                'assigned to this admission. You may save this classification as a secondary ' +
                                'classification.';
                        } else {
                            ctrl.message = 'Error saving classification, please try again!';
                        }
                    } else {
                        ctrl.close({$value: admitId});
                    }
                });
        }
    }

    function treatmentCategoryChange() {

        //get classifications by type
        if (ctrl.classification.treatmentCategory !== undefined) {
            var result = ctrl.classification.treatmentCategory.split('-');
            bodyArea = result[0];
            type = result[1];
            if (bodyArea === 'LUMBAR') {
                ctrl.isLumbar = true;
                ctrl.isTorticollis=false;
                ctrl.isTransplant = false;
                ctrl.isNonTransplant = false;
           
            } else {
                ctrl.isLumbar = false;
            }
            
            if (bodyArea === 'LYMPHEDEMA') {
                //ctrl.isHip = true;
            	 ctrl.isLymphedema=true;
              	ctrl.isLymphedemaSecondary=false;
              	 ctrl.isTorticollis=false;
              	ctrl.isTransplant = false;
                ctrl.isNonTransplant = false;
           
               
            }

            if (bodyArea === 'TORTICOLLIS') {
                //ctrl.isHip = true;
           	 ctrl.isTorticollis=true;
           	ctrl.isTransplant = false;
            ctrl.isNonTransplant = false;
           }
            
            if (bodyArea === 'LYMPHEDEMA SECONDARY') {
            	 ctrl.isLymphedema=false;
             	ctrl.isLymphedemaSecondary=true;
             	 ctrl.isTorticollis=false;
             	ctrl.isTransplant = false;
                ctrl.isNonTransplant = false;
            }

            if (bodyArea === 'HIP' && type === 'SURGICAL') {
                //ctrl.isHip = true;
                 ctrl.isHip = false;
                 ctrl.isTorticollis=false;
                 ctrl.isTransplant = false;
                 ctrl.isNonTransplant = false;
             
            } else {
                ctrl.isHip = false;
            }

            if (type === 'SURGICAL') {
                ctrl.isSurgical = true;           
                ctrl.isTraumatic = false;
                ctrl.isNonTraumatic = false;
                ctrl.isTorticollis=false;
                ctrl.isTransplant = false;
                ctrl.isNonTransplant = false;
            
            } else if (type === 'NONSURGICAL') {
                ctrl.isSurgical = false;                
                ctrl.isTraumatic = false;
                ctrl.isNonTraumatic = false;
                ctrl.isTransplant = false;
                ctrl.isNonTransplant = false;
          
            } else if (type === 'TRAUMATIC') {
                ctrl.isTraumatic = true;
                ctrl.isSurgical = false;
                ctrl.isNonTraumatic = false;
                ctrl.isTransplant = false;
                ctrl.isNonTransplant = false;
            
            }else if (type === 'NONTRAUMATIC') {
            	ctrl.isNonTraumatic = true;
                ctrl.isTraumatic = false;
                ctrl.isSurgical = false;
                ctrl.isTransplant = false;
                ctrl.isNonTransplant = false;
            
            }else if (type === 'TRANSPLANT') {
            	ctrl.isTransplant = true;
                ctrl.isNonTransplant = false;
                ctrl.isNonTraumatic = false;
                ctrl.isTraumatic = false;
                ctrl.isSurgical = false;  
                                
            }
            else if (type === 'NON TRANSPLANT') {
            	ctrl.isTransplant = false;
                ctrl.isNonTransplant = true;
                ctrl.isNonTraumatic = false;
                ctrl.isTraumatic = false;
                ctrl.isSurgical = false;
            }
            else{
            	ctrl.isNonTraumatic = false;
                ctrl.isTraumatic = false;
                ctrl.isSurgical = false;
            }

            classificationservice.getClassifications(bodyArea,type)
                .then(function (data) {
                    ctrl.classifications = data;
                });
            ctrl.showClassificationOption = true;
        }
    }
}


