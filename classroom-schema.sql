IF OBJECT_ID('dbo.Classrooms', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Classrooms (
        ClassID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL,
        CourseCode VARCHAR(30) NOT NULL,
        Description NVARCHAR(500) NULL,
        InstructorUserID VARCHAR(50) NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Classrooms_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Classrooms_Users FOREIGN KEY (InstructorUserID) REFERENCES dbo.Users(UserID)
    );
END;
GO

IF OBJECT_ID('dbo.ClassroomMemberships', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClassroomMemberships (
        MembershipID INT IDENTITY(1,1) PRIMARY KEY,
        ClassID INT NOT NULL,
        StudentUserID VARCHAR(50) NOT NULL,
        Status VARCHAR(20) NOT NULL CONSTRAINT DF_ClassroomMemberships_Status DEFAULT 'Pending',
        RequestedAt DATETIME2 NOT NULL CONSTRAINT DF_ClassroomMemberships_RequestedAt DEFAULT SYSUTCDATETIME(),
        ReviewedAt DATETIME2 NULL,
        CONSTRAINT CK_ClassroomMemberships_Status CHECK (Status IN ('Pending', 'Accepted')),
        CONSTRAINT UQ_ClassroomMemberships_Class_Student UNIQUE (ClassID, StudentUserID),
        CONSTRAINT FK_ClassroomMemberships_Classrooms FOREIGN KEY (ClassID) REFERENCES dbo.Classrooms(ClassID) ON DELETE CASCADE,
        CONSTRAINT FK_ClassroomMemberships_Users FOREIGN KEY (StudentUserID) REFERENCES dbo.Users(UserID)
    );

    CREATE INDEX IX_ClassroomMemberships_Status_ClassID
        ON dbo.ClassroomMemberships(Status, ClassID);
END;
GO