afw.BeforeAlterView 'crm_SalesCasesView'
go
alter view crm_SalesCasesView as 
	select SC.ID, 
		SC.Status,
		SC.IsActive, 
		SC.RequestType, 
		SC.SalesCaseStage, 
		SC.OwnerUser, 
		SC.Customer, 
		SC.Title,
		SC.RealStartDate,
		afw.GregorianToPersian(RealStartDate) RealStartDate_Persian,
		SC.CreationTime,
		SC.LastModifyTime,
		CustomerView.FullName Customer_Text,
		Stage.Title Stage_Text,
		Stage.SalesCaseProgress,
		RequestType.Title RequestType_Text,
		Status.Title Status_Text,
		SCSource.Title Source_Text,
		CustomerRecognitionMethod.Title CustomerRecognitionMethod_Text,
		CreatorUser.DisplayName CreatorUser_Text,
		OwnerUser.DisplayName OwnerUser_Text,
		SC.EstimatedRevenue,
		SC.SourceCampaign,
		SC.LastActionTime,
		afw.GregorianToPersian(SC.LastActionTime) LastActionTime_Persian,
		DATEDIFF(day, SC.CreationTime, GETDATE()) As DaysFromCreation,
		DATEDIFF(day, LastStageChangeHistory.CreationTime, GETDATE()) As DaysRemainedInCurrentStage,
		Stage.StageAllowedDays CurrentStageAllowedDays,
		case when DATEDIFF(day, SC.LastActionTime, GETDATE()) >= isnull(RequestType.SalesCasesStagnationDays, 10/*Default stagnation days*/)
			then 1
			else 0
		end IsStagnant
	from dbo.crm_FilteredSalesCases SC 
		inner join dbo.crm_SalesCaseStages Stage ON Stage.ID = SC.SalesCaseStage    
		inner join dbo.cmn_Persons Customer ON Customer.ID = SC.Customer
		inner join dbo.cmn_PersonsLookUpView CustomerView on CustomerView.ID = SC.Customer 
		inner join dbo.crm_SalesCaseRequestTypes RequestType on RequestType.ID = SC.RequestType 
		inner join dbo.afw_OptionSetItems Status on Status.ID = SC.Status 
		left join dbo.crm_SalesCaseSources SCSource on SCSource.ID = SC.SalesCaseSource
		left join dbo.crm_RecognitionMethods CustomerRecognitionMethod on CustomerRecognitionMethod.ID = Customer.RecognitionMethod
		left join afw_SystemUsersView CreatorUser on CreatorUser.ID = SC.CreatorUser
		left join afw_SystemUsersView OwnerUser on OwnerUser.ID = SC.OwnerUser 
		left join dbo.afw_OptionSetItems Gender on Gender.ID = Customer.Gender
		cross apply (
			select top 1 LastStageChangeHistory.*
			from crm_SalesCaseStageChangeHistorys LastStageChangeHistory
				left join crm_SalesCaseStageChangeHistorys NewerStageChangeHistory on NewerStageChangeHistory.SalesCase = SC.ID
					and NewerStageChangeHistory.CreationTime > LastStageChangeHistory.CreationTime
			where LastStageChangeHistory.SalesCase = SC.ID and NewerStageChangeHistory.ID is null
		) LastStageChangeHistory
go

afw.BeforeAlterView 'crm_SalesCaseHistoryView'
go
alter view crm_SalesCaseHistoryView as 
	select * from (
		select SalesCase.ID ItemID, 
			'SalesCreation' ItemType,
			N'ایجاد پرونده' ItemType_Text,
			'resource(cmn.AddRecordIcon1)' ItemType_Icon,
			N'ایجاد پرونده' ItemTitle,
			SalesCase.CreatorUser,
			CreatorUser.DisplayName CreatorUser_Text,
			SalesCase.CreationTime,
			afw.GregorianToPersian(SalesCase.CreationTime) CreationTime_Text, 
			SalesCase.ID SalesCase
		from crm_SalesCases SalesCase
			left join afw_SystemUsersView CreatorUser on CreatorUser.ID = SalesCase.CreatorUser
		union all
		select Note.ID ItemID, 
			'SalesCaseNote' ItemType,
			N'یادداشت' ItemType_Text,
			'resource(cmn.NoteIcon1)' ItemType_Icon,
			Note.NoteText ItemTitle,
			Note.CreatorUser,
			CreatorUser.DisplayName CreatorUser_Text,
			Note.CreationTime,
			afw.GregorianToPersian(Note.CreationTime) CreationTime_Text, 
			Note.SalesCase
		from crm_SalesCaseNotes Note
			left join afw_SystemUsersView CreatorUser on CreatorUser.ID = Note.CreatorUser
		union all
		select StageChangeHistory.ID ItemID, 
			'SalesCaseStageChange' ItemType,
			N'تغییر مرحله' ItemType_Text,
			'resource(cmn.EditIcon1)' ItemType_Icon,
			N'تغییر مرحله به ' + Stage.Title ItemTitle,
			StageChangeHistory.CreatorUser,
			CreatorUser.DisplayName CreatorUser_Text,
			StageChangeHistory.CreationTime,
			afw.GregorianToPersian(StageChangeHistory.CreationTime) CreationTime_Text,
			StageChangeHistory.SalesCase
		from crm_SalesCaseStageChangeHistorys StageChangeHistory
			inner join crm_SalesCaseStages Stage on Stage.ID = StageChangeHistory.SalesCaseStage
			left join afw_SystemUsersView CreatorUser on CreatorUser.ID = StageChangeHistory.CreatorUser			
		union all
		select StatusChangeHistory.ID ItemID,
			'SalesCaseStatusChange' ItemType, 
			N'تغییر وضعیت پرونده' ItemType_Text, 
			'resource(cmn.EditIcon1)' ItemType_Icon,
			N'تغییر وضعیت به ' + SalesCaseStatus.Title ItemTitle, 
			StatusChangeHistory.CreatorUser,
			CreatorUser.DisplayName CreatorUser_Text,
			StatusChangeHistory.CreationTime,
			afw.GregorianToPersian(StatusChangeHistory.CreationTime) CreationTime_Text,		
			StatusChangeHistory.SalesCase
		from crm_SalesCaseStatusChangeHistorys StatusChangeHistory
			inner join afw_OptionSetItems SalesCaseStatus on SalesCaseStatus.ID = StatusChangeHistory.Status
			left join afw_SystemUsersView CreatorUser on CreatorUser.ID = StatusChangeHistory.CreatorUser
		union all
		select OwnerUserChangeHistory.ID ItemID,
			'SalesCaseOwnerUserChange' ItemType, 
			N'تغییر مسئول پرونده' ItemType_Text,
			'resource(cmn.EditIcon1)' ItemType_Icon,
			N'تغییر مسئول پرونده به ' + OwnerUser.DisplayName ItemTitle,
			OwnerUserChangeHistory.CreatorUser,
			CreatorUser.DisplayName CreatorUser_Text,
			OwnerUserChangeHistory.CreationTime,
			afw.GregorianToPersian(OwnerUserChangeHistory.CreationTime) CreationTime_Text, 
			OwnerUserChangeHistory.SalesCase
		from crm_SalesCaseOwnerUserChangeHistorys OwnerUserChangeHistory
			inner join afw_SystemUsersView OwnerUser on OwnerUser.ID = OwnerUserChangeHistory.OwnerUser
			left join afw_SystemUsersView CreatorUser on CreatorUser.ID = OwnerUserChangeHistory.CreatorUser
		union all 
		select Activity.ID ItemID, 
			'Activity' ItemType,
			N'فعالیت' ItemType_Text,
			'resource(' +
				case when ActivityType.Name = 'Task' then 'cmn.ActivityTypeIcon1_Task' 
					when ActivityType.Name = 'Meeting' then 'cmn.ActivityTypeIcon1_Meeting' 
					when ActivityType.Name = 'Email' then 'cmn.ActivityTypeIcon1_Email' 
					when ActivityType.Name = 'OutgoingCall' then 'cmn.ActivityTypeIcon1_OutgoingCall' 
					when ActivityType.Name = 'IncommingCall' then 'cmn.ActivityTypeIcon1_IncommingCall' 
				else ''
				end + ')' ItemType_Icon,
			Activity.Title ItemTitle, 
			Activity.CreatorUser,
			CreatorUser.DisplayName CreatorUser_Text,
			Activity.CreationTime,
			afw.GregorianToPersian(Activity.CreationTime) CreationTime_Text, 
			Activity.SalesCase			
		from cmn_Activities Activity
			inner join afw_OptionSetItems ActivityType on ActivityType.ID = Activity.ActivityType
			left join afw_SystemUsersView CreatorUser on CreatorUser.ID = Activity.CreatorUser
		union all 
		select AttachedFile.ID ItemID, 
			'SalesCaseAttachedFile' ItemType, 		
			N'فایل پیوست' ItemType_Text,
			'resource(cmn.FileAttachmentIcon1)' ItemType_Icon,
			case when AttachedFile.Title is not null and ltrim(rtrim(AttachedFile.Title)) <> '' then
				AttachedFile.Title + ' (' + StoredFile.OriginalFileName + ')' 
			else StoredFile.OriginalFileName
			end as ItemTitle, 
			AttachedFile.CreatorUser,
			CreatorUser.DisplayName CreatorUser_Text,
			AttachedFile.CreationTime,
			afw.GregorianToPersian(AttachedFile.CreationTime) CreationTime_Text,
			AttachedFile.SalesCase
		from crm_SalesCaseAttachedFiles AttachedFile
			inner join afw_ServerStoredFiles StoredFile on StoredFile.ID = AttachedFile.AttachedFile
			left join afw_SystemUsersView CreatorUser on CreatorUser.ID = AttachedFile.CreatorUser
	) SalesCaseHistory
go

afw.BeforeAlterView 'crm_DailyCalenderActivitiesView'
go
alter view crm_DailyCalenderActivitiesView as 
	select Activity.ID, 
		Activity.Title ItemDescription,
		DATEADD(dd, 0, DATEDIFF(dd, 0, Activity.ScheduledTime)) ItemDate,
		Activity.ScheduledTime ItemTime,
		ActivityType.Name MinorType,
		ActivityType.Title MinorType_Text,
		Activity.CreatorUser,
		Activity.OwnerUser,
		OwnerUser.DisplayName OwnerUser_Text,
		Activity.Priority,
		Activity.ActivityStatus,
		Activity.SalesCase SalesCaseID,
		SalesCase.Title SalesCase_Title,
		SalesCaseCustomer.FullName SalesCaseCustomer_Text
	from cmn_FilteredActivities Activity
		inner join afw_OptionSetItems ActivityType on ActivityType.ID = Activity.ActivityType
		inner join afw_SystemUsersView OwnerUser on OwnerUser.ID = Activity.OwnerUser
		left join crm_SalesCases SalesCase on SalesCase.ID = Activity.SalesCase
		left join cmn_PersonsView SalesCaseCustomer on SalesCaseCustomer.ID = SalesCase.Customer
go
