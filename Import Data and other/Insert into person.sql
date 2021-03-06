insert into [SERVER\TARAZ2008].[AppFrameworkDB].[dbo].cmn_Persons (
	ID, ExportedRecordID, Name, TelNumber1, Email, PersonType)  
select newid() as ID, CustomerID as ExportedRecordID, 
	CompanyName + ' (' + Name + ' ' + isnull(Family, '') + ')' as Name,
	Tell1 + case when isnull(Fax, '') <> '' then ' (Fax: ' + Fax + ')' else '' end
		+ case when isnull(Mobile, '') <> '' then ' (Mobile: ' + Mobile + ')' else '' end TellNumber,
	File3 as Email , 'f986a269-8007-440f-9e40-a1917dbc366d'
from storeCustomer
where ltrim(rtrim(CompanyName)) <> '' 
	and ltrim(rtrim(name)) <> N'تبلیغات' and name not like N'%اشتباه%'
	and name not like N'%عمومی%' and name not like N'%استخدام%' 

insert into [SERVER\TARAZ2008].[AppFrameworkDB].[dbo].cmn_Persons (
	ID, ExportedRecordID, LastName, TelNumber1, Email, Gender, PersonType)
select newid(), CustomerID ExportedRecordID, 
	Name + ' ' + isnull(Family, '') as Name,
	Tell1 + case when isnull(Fax, '') <> '' then ' (Fax: ' + Fax + ')' else '' end
		+ case when isnull(Mobile, '') <> '' then ' (Mobile: ' + Mobile + ')' else '' end TellNumber,
	ltrim(rtrim(File3)) as Email,
	case when isnull(Gender, 1) = 1 then '8f041890-8334-4395-8448-e6d253bd7195' else '6bd9198b-ccd6-4af9-85e2-3b6a1a3621b5' end Gender,
	'b8e5c2d4-2d14-4004-8102-60d4b587de23' as PersonType
from storeCustomer
where ltrim(rtrim(CompanyName)) = '' 
	and ltrim(rtrim(name)) <> N'تبلیغات' and name not like N'%اشتباه%'
	and name not like N'%عمومی%' and name not like N'%استخدام%' 
