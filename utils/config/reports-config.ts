/**
 * Reports Configuration
 * 
 * Centralized configuration for all report-related constants including:
 * - Report names
 * - CSV headers
 * - Test data values
 * - Validation rules
 */

// Account Solutions Reports Configuration
export const accountSolutionsReportsConfig = {
  reportNames: [
    'Invoice Tasks Report',
    'TC AR Report',
    'TC Email Export',
    'TC Text Message Export',
    'Invoice Activity Report',
    'Paid Invoice Report',
    'Notes History Report',
    'Account Solutions Task Report',
    'Account Solutions Communication Report'
  ] as const,

  excludedReports: [
    'Account Solutions Task Report'
  ] as const,

  // If reportsToTest is specified, only these reports will be tested (overrides excludedReports logic)
  // If undefined or empty, all reports except excludedReports will be tested
  reportsToTest: undefined as readonly string[] | undefined,
  // Uncomment and populate to test specific reports:
  // reportsToTest: [
  //   'Notes History Report'
  // ] as const,

  csvHeaders: {
    'Invoice Tasks Report': [
      'Invoice date',
      'Invoice No.',
      'Billing Type',
      'Collector\'s Name',
      'No. of Overdue Tasks',
      'No. of Due Today Tasks',
      'Next Task Completion Date',
      'CS Follow Up Date',
      'Transaction Type',
      'Balance Due'
    ],
    'TC AR Report': [
      'Invoice date',
      'Collectors Name',
      'Transaction State',
      'Entity Name',
      'Billing Type',
      'Customer ID Prefix',
      'Customer ID Suffix',
      'Customer Name',
      'Invoice Number',
      'Agent Offboarded Date',
      'GL Posting Date',
      'Due Date',
      'Collection Status',
      'Orig. Invoice Amount',
      'Amount Paid',
      'Balance Due',
      'Transaction_type'
    ],
    'TC Email Export': [
      'Invoice Date',
      'Customer Name',
      'Customer ID Prefix',
      'Customer ID Suffix',
      'Transaction State',
      'Billing Type',
      'Invoice Number',
      'Balance Due',
      'Email 1',
      'Email 2',
      'To Be Completed Task 1',
      'Task Due Date 1',
      'To Be Completed Task 2',
      'Task Due Date 2',
      'To Be Completed Task 3',
      'Task Due Date 3'
    ],
    'TC Text Message Export': [
      'Invoice Date',
      'Customer Name',
      'Customer ID Prefix',
      'Customer ID Suffix',
      'Transaction State',
      'Billing Type',
      'Invoice Number',
      'Balance Due',
      'Phone 1',
      'Phone 2',
      'Open Task Name 1',
      'Task Due Date 1',
      'Open Task Name 2',
      'Task Due Date 2',
      'Open Task Name 3',
      'Task Due Date 3'
    ],
    'Invoice Activity Report': [
      'Invoice Date',
      'Collectors Name',
      'Billing Type',
      'Invoice',
      'GL Posting Date',
      'Due Date',
      'Amount',
      'Amount Due',
      'Most Recent Activity Date on the Activity Log',
      'Most Recent Activity Description on the Activity Log'
    ],
    'Paid Invoice Report': [
      'Invoice Date',
      'Collectors Name',
      'Billing Type',
      'Invoice',
      'GL Posting Date',
      'Due Date',
      'Amount',
      'Amount Paid',
      'Paid Date',
      'Days to Paid'
    ],
    'Notes History Report': [
      'Agent Name',
      'Customer ID Suffix',
      'Billing Type',
      'Collection Status',
      'Collection Status Reason',
      'Invoice #',
      'GL Posting Date',
      'Balance Due',
      'Invoice Status',
      'Transaction State',
      'Note Date',
      'Note Type',
      'Note Description'
    ],
    'Account Solutions Communication Report': [
      'Module Name',
      'Invoice Number',
      'Communication Type',
      'Sending Role',
      'Sending User',
      'Send Date / Time',
      'Task ID',
      'Task Template',
      'Subject',
      'Message',
      'Recipient Info',
      'CC Recipient Info',
      'Sent Status',
      'Error Details',
      'Billing State',
      'Send Method'
    ]
  },

  dropdownValues: {
    'Notes History Report': {
      invoiceStatus: ['All', 'Open', 'Close']
    }
  }
} as const;

// Onboarding Reports Configuration
export const onboardingReportsConfig = {
  reportNames: [
    'Onboarding Team Status Report',
    'Onboarding Status Report',
    'Onboarding Specialist Productivity Report',
    'Onboarding Specialist Report',
    'Brokerage Ops',
    'Completed Tasks',
    'Custom Data Export Tasks',
    'Onboarding Task Report',
    'Onboarding Communication Report',
    'Onboarding Module Agents'
  ] as const,

  excludedReports: [
    'Onboarding Task Report'
  ] as const,

  // If reportsToTest is specified, only these reports will be tested (overrides excludedReports logic)
  // If undefined or empty, all reports except excludedReports will be tested
  reportsToTest: undefined as readonly string[] | undefined,
  // Uncomment and populate to test specific reports:
  // reportsToTest: [
  //   'Onboarding Specialist Productivity Report'
  // ] as const,

  csvHeaders: {
    'Onboarding Team Status Report': [
      '# of agents moved through Review Complete Date',
      'Average time from TC Join Agent Create Date to Review Complete Date',
      'Average time from TC Join Agent Create Date to Review Complete Date',
      '# of agents moved through Agent Active Date',
      'Avg Time Between Move agent to License Transfer step task and Convert agent to active in Enterprise task',
      'Average time from TC Join Agent Create Date to Agent Active Date'
    ],
    'Onboarding Status Report': [
      '# of agents moved through Review Complete Date',
      'Average time from TC Join Agent Create Date to Review Complete Date',
      'Avg Time Between Verify License task and Move agent to License Transfer step task',
      '# of agents moved through Agent Active Date',
      'Avg Time Between Move agent to License Transfer step task and Convert agent to active in Enterprise task',
      'Average time from TC Join Agent Create Date to Agent Active Date'
    ],
    'Onboarding Specialist Productivity Report': [
      'OBS - Name',
      'Sub-Type',
      'State',
      '# of Assigned Agents with Joining Agent status as Joining',
      '# of agents moved through Review Complete Date',
      'Average time from TC Join Agent Create Date to Review Complete Date',
      'Avg Time Between Verify License task and Move agent to License Transfer step task',
      '# of agents moved through Agent Active Date',
      'Avg Time Between Move agent to License Transfer step task and Convert agent to active in Enterprise task',
      'Average time from TC Join Agent Create Date to Agent Active Date'
    ],
    'Onboarding Specialist Report': [
      'User Name',
      'Assigned New Agents',
      'Completed Verify License Task',
      'Completed Review Documents Task',
      'Completed Convert agent to active in Enterprise task',
      'Completed Add agent to team roster or notify Integrations of new potential team',
      'Completed Update Roster and send HubSpot ticket to Team Services'
    ],
    'Brokerage Ops': [
      'ASA Name',
      'State',
      'Count of Agents Assigned'
    ],
    'Completed Tasks': [
      'Task Completer User Name',
      'Task Completer User Email',
      'Task Completer User Role',
      'Completed Task Create Date',
      'Completed Task Completed Date',
      'Completed Task Due Date',
      'Completed Task Name',
      'Completed Task Primary Attribute',
      'Completed Task Secondary Attribute'
    ],
    'Custom Data Export Tasks': [
      'Task Assign To User Name',
      'Task Assign To User Email',
      'Task Assign To User Role',
      'Task Template Name',
      'Task Name',
      'Task Primary Attribute',
      'Task Secondary Attribute',
      'Task Create Date',
      'Task Due Date',
      'Task Status'
    ],
    'Onboarding Communication Report': [
      'Module Name',
      'Agent Name',
      'Communication Type',
      'Sending Role',
      'Sending User',
      'Send Date / Time',
      'Task ID',
      'Task Template',
      'Subject',
      'Message',
      'Recipient Info',
      'CC Recipient Info',
      'Sent Status',
      'Error Details',
      'Business Entity',
      'Send Method'
    ],
    'Onboarding Module Agents': [
      'Agent Enterprise ID',
      'Agent Name',
      'Agent Type',
      'Business Entity',
      'Join Agent Status',
      'Primary Licensed State',
      'Join Application Complete Date/Timestamp',
      'Review Complete Date/Timestamp',
      'License Transfer Date/Timestamp',
      'Agent Active Date',
      'Agent Active Date Added At',
      'Revision(s) Needed',
      'Agent Action Needed',
      'Waiting on Association | DRE | MLS'
    ]
  },

  testData: {
    teamNames: {
      'Onboarding Team Status Report': 'Go Arizona'
    },
    states: {
      'Onboarding Specialist Productivity Report': {
        displayName: 'Arizona',
        code: 'AZ'
      }
    },
    specialists: {
      'Onboarding Specialist Report': 'Auto OB Specialist'
    }
  }
} as const;

// Common Test Configuration
export const reportsTestConfig = {
  alertMessages: {
    reportGeneration: 'Due to the volume of the report, the report is generating and will be emailed to you for download shortly'
  },
  
  dateRanges: {
    defaultDaysBack: 7,
    defaultDaysForward: 0
  }
} as const;

// Type exports for type safety
export type AccountSolutionsReportName = typeof accountSolutionsReportsConfig.reportNames[number];
export type OnboardingReportName = typeof onboardingReportsConfig.reportNames[number];

