export class ParticipantColumn {

  // participant columns
  public static REALM = new ParticipantColumn('DDP', 'ddp', 'data');
  public static SHORT_ID = new ParticipantColumn('Short ID', 'hruid', 'data', 'profile');
  public static LEGACY_SHORT_ID = new ParticipantColumn('Legacy Short ID', 'legacyShortId', 'data', 'profile');
  public static PARTICIPANT_ID = new ParticipantColumn('Participant ID', 'guid', 'data', 'profile');
  public static LEGACY_PARTICIPANT_ID = new ParticipantColumn('Legacy Participant ID', 'legacyAltPid', 'data', 'profile');
  public static FIRST_NAME = new ParticipantColumn('First Name', 'firstName', 'data', 'profile');
  public static LAST_NAME = new ParticipantColumn('Last Name', 'lastName', 'data', 'profile');
  public static COUNTRY = new ParticipantColumn('Country', 'country', 'data', 'address');
  public static EMAIL = new ParticipantColumn('Email', 'email', 'data', 'profile');
  public static REGISTRATION_DATE = new ParticipantColumn('Registration Date', 'createdAt', 'data', 'profile');
  public static ENROLLMENT_STATUS = new ParticipantColumn('Status', 'status', 'data');
  public static DO_NOT_CONTACT = new ParticipantColumn('Do Not Contact', 'doNotContact', 'data', 'profile');
  public static PREFERRED_LANGUAGE = new ParticipantColumn('Preferred Language', 'preferredLanguage', 'data', 'profile');
  public static DATE_OF_MAJORITY = new ParticipantColumn('Date of Majority', 'dateOfMajority', 'data', 'dsm');
  public static HAS_CONSENTED_TO_BLOOD = new ParticipantColumn('Consent Blood', 'hasConsentedToBloodDraw', 'data', 'dsm');
  public static HAS_CONSENTED_TO_TISSUE = new ParticipantColumn('Consent Tissue', 'hasConsentedToTissueSample', 'data', 'dsm');
  public static DATE_OF_BIRTH = new ParticipantColumn('Date of Birth', 'dateOfBirth', 'data', 'dsm');
  public static DIAGNOSIS_MONTH = new ParticipantColumn('Diagnosis Month', 'diagnosisMonth', 'data', 'dsm');
  public static DIAGNOSIS_YEAR = new ParticipantColumn('Diagnosis Year', 'diagnosisYear', 'data', 'dsm');

  //files
  public static PARTICIPANT_FILE_NAMES = new ParticipantColumn('Uploaded File Name', 'fileName', 'data', 'files');
  public static PARTICIPANT_FILE_UPLOAD_TIME = new ParticipantColumn('File Upload Time', 'uploadedAt', 'data', 'files');

  public static ONC_HISTORY_CREATED = new ParticipantColumn('Onc History Created', 'created', 'o');
  public static ONC_HISTORY_REVIEWED = new ParticipantColumn('Onc History Reviewed', 'reviewed', 'o');
  public static PAPER_CR_SENT = new ParticipantColumn('Paper C/R Sent', 'crSent', 'r');
  public static PAPER_CR_RECEIVED = new ParticipantColumn('Paper C/R Received', 'crReceived', 'r');
  public static PARTICIPANT_NOTES = new ParticipantColumn('Participant Notes', 'notes', 'r');
  public static MINIMAL_RECORDS = new ParticipantColumn('Incomplete/Minimal Medical Records', 'minimalMr', 'r');
  public static ABSTRACTION_READY = new ParticipantColumn('Ready for Abstraction', 'abstractionReady', 'r');
  public static ASSIGNEE_MR = new ParticipantColumn('MR Assignee', 'assigneeIdMr', 'p');
  public static ASSIGNEE_TISSUE = new ParticipantColumn('Tissue Assignee', 'assigneeIdTissue', 'p');
  public static EXIT_DATE = new ParticipantColumn('Date Withdrawn', 'exitDate', 'p');

  // mr columns
  public static MR_TYPE = new ParticipantColumn('Type', 'type', 'm');
  public static MR_INSTITUTION_NAME = new ParticipantColumn('Institution Name', 'name', 'm');
  public static MR_INSTITUTION_CONTACT = new ParticipantColumn('Institution Contact Person', 'contact', 'm');
  public static MR_INSTITUTION_PHONE = new ParticipantColumn('Institution Phone', 'phone', 'm');
  public static MR_INSTITUTION_FAX = new ParticipantColumn('Institution Fax', 'fax', 'm');
  public static MR_FAX_SENT = new ParticipantColumn('Initial MR Request', 'faxSent', 'm');
  public static MR_FAX_SENT_2 = new ParticipantColumn('Initial MR Request 2', 'faxSent2', 'm');
  public static MR_FAX_SENT_3 = new ParticipantColumn('Initial MR Request 3', 'faxSent3', 'm');
  public static MR_RECEIVED = new ParticipantColumn('Initial MR Received', 'mrReceived', 'm');
  public static MR_DOCUMENT = new ParticipantColumn('MR Document', 'mrDocument', 'm');
  public static MR_DOCUMENT_FILES = new ParticipantColumn('MR Document File Names', 'mrDocumentFileNames', 'm');
  public static MR_PROBLEM = new ParticipantColumn('MR Problem', 'mrProblem', 'm');
  public static MR_PROBLEM_TEXT = new ParticipantColumn('MR Problem Text', 'mrProblemText', 'm');
  public static MR_UNABLE_TO_OBTAIN = new ParticipantColumn('MR Unable to Obtain', 'unableObtain', 'm');
  public static MR_DUPLICATE = new ParticipantColumn('Duplicate', 'duplicate', 'm');
  public static MR_INTERNATIONAL = new ParticipantColumn('International', 'international', 'm');
  public static MR_PAPER_CR = new ParticipantColumn('Paper C/R required', 'crRequired', 'm');
  public static PATHOLOGY_RESENT = new ParticipantColumn('Pathology Present', 'pathologyPresent', 'm');
  public static MR_NOTES = new ParticipantColumn('MR Notes', 'notes', 'm');
  public static MR_REVIEW = new ParticipantColumn('MR Review', 'reviewMedicalRecord', 'm');
  public static MR_FOLLOW_UP = new ParticipantColumn('Follow-Up ', 'followUps', 'm');
  public static MR_FOLLOW_REQUIRED = new ParticipantColumn('Follow-Up required', 'followupRequired', 'm');
  public static MR_FOLLOW_REQUIRED_TEXT = new ParticipantColumn('Follow-Up required Text', 'followupRequiredText', 'm');

  // oncHistoryDetail columns
  public static ACCESSION_NUMBER = new ParticipantColumn('Accession Number', 'accessionNumber', 'oD');
  public static DATE_PX = new ParticipantColumn('Date of PX', 'datePx', 'oD');
  public static TYPE_PX = new ParticipantColumn('Type of PX', 'typePx', 'oD');
  public static FACILITY = new ParticipantColumn('Facility', 'facility', 'oD');
  public static FACILITY_PHONE = new ParticipantColumn('Facility Phone', 'phone', 'oD');
  public static FACILITY_FAX = new ParticipantColumn('Facility Fax', 'fax', 'oD');
  public static HISTOLOGY = new ParticipantColumn('Histology', 'histology', 'oD');
  public static LOCATION_PX = new ParticipantColumn('Location of PX', 'locationPx', 'oD');
  public static ONC_HISTORY_NOTES = new ParticipantColumn('OncHistory Notes', 'notes', 'oD');
  public static ONC_HISTORY_REQUEST = new ParticipantColumn('Request Status', 'request', 'oD');
  public static TISSUE_FAX = new ParticipantColumn('Tissue Request Date', 'faxSent', 'oD');
  public static TISSUE_FAX_2 = new ParticipantColumn('Tissue Request Date 2', 'faxSent2', 'oD');
  public static TISSUE_FAX_3 = new ParticipantColumn('Tissue Request Date 3', 'faxSent3', 'oD');
  public static TISSUE_RECEIVED = new ParticipantColumn('Tissue Received', 'tissueReceived', 'oD');
  public static GENDER = new ParticipantColumn('Gender', 'gender', 'oD');
  public static DESTRUCTION_POLICY = new ParticipantColumn('Destruction Policy (years)', 'destructionPolicy', 'oD');
  public static TISSUE_PROBLEM_OPTION = new ParticipantColumn('Problem with Tissue', 'tissueProblemOption', 'oD');
  public static UNABLE_OBTAIN_TISSUE = new ParticipantColumn('Unable To Obtain', 'unableObtainTissue', 'oD');

  // tissue column
  public static COUNT_RECEIVED = new ParticipantColumn('Count Received', 'countReceived', 't');
  public static TISSUE_NOTES = new ParticipantColumn('Tissue Notes', 'notes', 't');
  public static TISSUE_TYPE = new ParticipantColumn('Tissue Type', 'tissueType', 't');
  public static TISSUE_SITE = new ParticipantColumn('Tissue Site', 'tissueSite', 't');
  public static TUMOR_TYPE = new ParticipantColumn('Tumor Type', 'tumorType', 't');
  public static H_E = new ParticipantColumn('H&E', 'hE', 't');
  public static PATHOLOGY_REPORT = new ParticipantColumn('Pathology Report', 'pathologyReport', 't');
  public static COLLABORATOR_SAMPLE_ID = new ParticipantColumn('Tumor Collaborator Sample ID', 'collaboratorSampleId', 't');
  public static BLOCK_SENT = new ParticipantColumn('Block to SHL', 'blockSent', 't');
  public static BLOCK_ID_SHL = new ParticipantColumn('Block ID to SHL', 'blockIdShl', 't');
  public static SCROLL_RECEIVED = new ParticipantColumn('Scrolls back from SHL', 'scrollsReceived', 't');
  public static SK_ID = new ParticipantColumn('SK ID', 'skId', 't');
  public static SM_ID = new ParticipantColumn('SM ID for H&E', 'smId', 't');
  public static SENT_GP = new ParticipantColumn('Date sent to GP', 'sentGp', 't');
  public static TISSUE_RETURNED = new ParticipantColumn('Return Date', 'returnDate', 't');
  public static TISSUE_EXPECTED_RETURN = new ParticipantColumn('Expected Return Date', 'expectedReturn', 't');
  public static TISSUE_TRACKING_NUMBER = new ParticipantColumn('Tracking Number', 'returnFedexId', 't');
  public static TISSUE_SHL_NUMBER = new ParticipantColumn('SHL Work Number', 'shlWorkNumber', 't');
  public static TISSUE_FIRST_SM_ID = new ParticipantColumn('First SM ID', 'firstSmId', 't');
  public static TISSUE_TUMOR_PERCENT = new ParticipantColumn('Tumor Percentage as reported by SHL', 'tumorPercentage', 't');
  public static TISSUE_SEQUENCE = new ParticipantColumn('Sequencing Results', 'tissueSequence', 't');
  public static SCROLLS_COUNT = new ParticipantColumn('Scroll(s)', 'scrollsCount', 't');
  public static BLOCKS_COUNT = new ParticipantColumn('Block(s)', 'blocksCount', 't');
  public static USS_COUNT = new ParticipantColumn('USS (unstained slides)', 'ussCount', 't');
  public static H_E_COUNT = new ParticipantColumn('H&E(s)', 'hECount', 't');
  public static SM_ID_VALUE = new ParticipantColumn('SM-ID value', 'smIdValue', 'sm');

  // abstraction column
  public static ABSTRACTION = new ParticipantColumn('Abstraction', 'abstraction');
  public static ABSTRACTION_STATUS = new ParticipantColumn('Status', 'aStatus', 'a');
  public static ABSTRACTION_ACTIVITY = new ParticipantColumn('Activity', 'activity', 'a');
  public static ABSTRACTION_USER = new ParticipantColumn('User', 'user', 'a');
  public static REVIEW = new ParticipantColumn('Review', 'review');
  public static QC = new ParticipantColumn('QC', 'qc');

  // kit
  public static COLLABORATOR_SAMPLE = new ParticipantColumn('Normal Collaborator Sample ID', 'bspCollaboratorSampleId', 'k');
  public static COLLABORATOR_PARTICIPANT_ID = new ParticipantColumn('Collaborator Participant ID', 'bspCollaboratorParticipantId', 'k');
  public static SAMPLE_TYPE = new ParticipantColumn('Sample Type', 'kitTypeName', 'k');
  public static SAMPLE_SENT = new ParticipantColumn('Sample Sent', 'scanDate', 'k');
  public static SAMPLE_RECEIVED = new ParticipantColumn('Sample Received', 'receiveDate', 'k');
  public static SAMPLE_DEACTIVATION = new ParticipantColumn('Sample Deactivation', 'deactivatedDate', 'k');
  public static TRACKING_TO_PARTICIPANT = new ParticipantColumn('Tracking-out', 'trackingNumberTo', 'k');
  public static TRACKING_RETURN = new ParticipantColumn('Tracking-in', 'trackingReturnId', 'k');
  public static MF_BARCODE = new ParticipantColumn('MF code', 'kitLabel', 'k');
  public static STATUS_OUT = new ParticipantColumn('Status-out', 'upsTrackingStatus', 'k');
  public static STATUS_IN = new ParticipantColumn('Status-in', 'upsReturnStatus', 'k');
  public static EXTERNAL_ORDER_NUMBER = new ParticipantColumn('External Order Number', 'externalOrderNumber', 'k');
  public static EXTERNAL_ORDER_DATE = new ParticipantColumn('External Order Date', 'externalOrderDate', 'k');
  public static CARE_EVOLVE = new ParticipantColumn('Ordered at CareEvolve', 'careEvolve', 'k');
  public static UPLOAD_REASON = new ParticipantColumn('Upload Reason', 'uploadReason', 'k');
  public static SAMPLE_QUEUE = new ParticipantColumn('Status', 'sampleQueue', 'k');
  public static RESULT_TEST = new ParticipantColumn('Test Result', 'result', 'k', 'testResult');
  public static CORRECTED_TEST = new ParticipantColumn('Test Corrected', 'isCorrected', 'k', 'testResult');
  public static TIME_TEST = new ParticipantColumn('Test Time Completed', 'timeCompleted', 'k', 'testResult');
  public static COLLECTION_DATE = new ParticipantColumn('Collection Date', 'collectionDate', 'k');
  public static SEQUENCING_RESTRICTION = new ParticipantColumn('Sequencing Restriction', 'sequencingRestriction', 'k');
  public static SAMPLE_NOTES = new ParticipantColumn('Sample Notes', 'sampleNotes', 'k');
  //Cohort tags
  public static COHORT_TAG_NAME = new ParticipantColumn('Cohort Tag Name', 'cohortTagName', 'c', 'dsm');

  //Clinical Orders
  public static CLINICAL_ORDER_STATUS = new ParticipantColumn('Clinical Order Status', 'orderStatus', 'cl', 'dsm');
  public static CLINICAL_ORDER_ID = new ParticipantColumn('Clinical Order Id', 'orderId', 'cl', 'dsm');
  public static CLINICAL_ORDER_PDO = new ParticipantColumn('Clinical Order PDO #', 'mercuryPdoId', 'cl', 'dsm');
  public static CLINICAL_ORDER_DATE = new ParticipantColumn('Clinical Order Date', 'orderDate', 'cl', 'dsm');
  public static CLINICAL_STATUS_DATE = new ParticipantColumn('Clinical Order Status Date', 'statusDate', 'cl', 'dsm');

  //FON
  public static ACTIVITY_STATUS = new ParticipantColumn('Enrollment Status', 'activityStatus', 'data');

  constructor(public display: string, public name: string, public tableAlias?: string, public object?: string, public esData?: boolean) {
    this.display = display;
    this.name = name;
    this.tableAlias = tableAlias;
    this.object = object;
    this.esData = esData;
  }

  public static parse(json): ParticipantColumn {
    if (json === undefined) {
      return null;
    }
    return new ParticipantColumn(json.display, json.name, json.tableAlias);
  }
}
