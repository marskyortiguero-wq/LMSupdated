const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const { randomBytes } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json()); // Para mabasa ang JSON mula sa frontend

const sessions = new Map();

// SQL Server Configuration
const dbConfig = {
    server: process.env.DB_SERVER || '.\\SQLEXPRESS02',
    database: process.env.DB_NAME || 'LMS_DB',
    driver: 'ODBC Driver 17 for SQL Server',
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ success: false, message: 'Account ID and password are required.' });
    }

    try {
        await sql.connect(dbConfig);
        // Parameterized query para iwas SQL Injection
        const result = await sql.query`SELECT FirstName, LastName, Role FROM Users WHERE UserID = ${userId} AND Password = ${password}`;

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const token = randomBytes(32).toString('hex');
            const role = String(user.Role || '').trim().toLowerCase();
            if (!['student', 'instructor', 'dean', 'admin', 'administrator'].includes(role)) {
                return res.status(403).json({ success: false, message: 'This account has no supported role.' });
            }
            sessions.set(token, { userId, role: role === 'administrator' ? 'admin' : role });
            res.json({
                success: true,
                token,
                name: [user.FirstName, user.LastName].filter(Boolean).join(' '),
                role: user.Role
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid account ID or password.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database connection error.' });
    }
});

function requireAuth(req, res, next) {
    const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const session = token && sessions.get(token);
    if (!session) return res.status(401).json({ message: 'Please sign in again.' });
    req.user = session;
    next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission to do this.' });
        next();
    };
}

app.post('/api/logout', requireAuth, (req, res) => {
    sessions.delete(req.get('Authorization').replace(/^Bearer\s+/i, ''));
    res.json({ success: true });
});

app.get('/api/classrooms', requireAuth, async (req, res) => {
    try {
        await sql.connect(dbConfig);
        if (req.user.role === 'student') {
            const result = await sql.query`SELECT c.ClassID AS id, c.Name AS name, c.CourseCode AS courseCode, c.Description AS description, CONCAT(i.FirstName, ' ', i.LastName) AS instructorName, m.Status AS membershipStatus FROM dbo.Classrooms c INNER JOIN dbo.Users i ON i.UserID = c.InstructorUserID LEFT JOIN dbo.ClassroomMemberships m ON m.ClassID = c.ClassID AND m.StudentUserID = ${req.user.userId} ORDER BY c.CreatedAt DESC`;
            return res.json({ classrooms: result.recordset });
        }

        const result = req.user.role === 'instructor'
            ? await sql.query`SELECT c.ClassID AS id, c.Name AS name, c.CourseCode AS courseCode, c.Description AS description, COUNT(CASE WHEN m.Status = 'Accepted' THEN 1 END) AS studentCount, COUNT(CASE WHEN m.Status = 'Pending' THEN 1 END) AS pendingCount FROM dbo.Classrooms c LEFT JOIN dbo.ClassroomMemberships m ON m.ClassID = c.ClassID WHERE c.InstructorUserID = ${req.user.userId} GROUP BY c.ClassID, c.Name, c.CourseCode, c.Description, c.CreatedAt ORDER BY c.CreatedAt DESC`
            : await sql.query`SELECT c.ClassID AS id, c.Name AS name, c.CourseCode AS courseCode, c.Description AS description, CONCAT(i.FirstName, ' ', i.LastName) AS instructorName FROM dbo.Classrooms c INNER JOIN dbo.Users i ON i.UserID = c.InstructorUserID ORDER BY c.CreatedAt DESC`;
        res.json({ classrooms: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not load classrooms.' });
    }
});

app.post('/api/classrooms', requireAuth, requireRole('instructor'), async (req, res) => {
    const name = String(req.body.name || '').trim();
    const courseCode = String(req.body.courseCode || '').trim();
    const description = String(req.body.description || '').trim();
    if (!name || !courseCode) return res.status(400).json({ message: 'Class name and course code are required.' });

    try {
        await sql.connect(dbConfig);
        const result = await sql.query`INSERT INTO dbo.Classrooms (Name, CourseCode, Description, InstructorUserID) OUTPUT INSERTED.ClassID AS id VALUES (${name}, ${courseCode}, ${description || null}, ${req.user.userId})`;
        res.status(201).json({ success: true, id: result.recordset[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not create classroom.' });
    }
});

app.post('/api/classrooms/:classId/join', requireAuth, requireRole('student'), async (req, res) => {
    const classId = Number.parseInt(req.params.classId, 10);
    if (!Number.isInteger(classId)) return res.status(400).json({ message: 'Invalid classroom.' });

    try {
        await sql.connect(dbConfig);
        const existing = await sql.query`SELECT MembershipID, Status FROM dbo.ClassroomMemberships WHERE ClassID = ${classId} AND StudentUserID = ${req.user.userId}`;
        if (existing.recordset.length) {
            const status = existing.recordset[0].Status;
            return res.status(409).json({ message: status === 'Accepted' ? 'You are already in this class.' : 'Your request is already waiting for approval.' });
        }

        const classroom = await sql.query`SELECT ClassID FROM dbo.Classrooms WHERE ClassID = ${classId}`;
        if (!classroom.recordset.length) return res.status(404).json({ message: 'Classroom not found.' });
        await sql.query`INSERT INTO dbo.ClassroomMemberships (ClassID, StudentUserID) VALUES (${classId}, ${req.user.userId})`;
        res.status(201).json({ success: true, status: 'Pending' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not send join request.' });
    }
});

app.get('/api/classroom-requests', requireAuth, requireRole('instructor'), async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT m.MembershipID AS id, m.ClassID AS classId, c.Name AS className, c.CourseCode AS courseCode, u.UserID AS studentUserId, CONCAT(u.FirstName, ' ', u.LastName) AS studentName, m.RequestedAt AS requestedAt FROM dbo.ClassroomMemberships m INNER JOIN dbo.Classrooms c ON c.ClassID = m.ClassID INNER JOIN dbo.Users u ON u.UserID = m.StudentUserID WHERE c.InstructorUserID = ${req.user.userId} AND m.Status = 'Pending' ORDER BY m.RequestedAt ASC`;
        res.json({ requests: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not load join requests.' });
    }
});

app.post('/api/classroom-requests/:requestId/accept', requireAuth, requireRole('instructor'), async (req, res) => {
    const requestId = Number.parseInt(req.params.requestId, 10);
    if (!Number.isInteger(requestId)) return res.status(400).json({ message: 'Invalid request.' });

    try {
        await sql.connect(dbConfig);
        const result = await sql.query`UPDATE m SET Status = 'Accepted', ReviewedAt = SYSUTCDATETIME() FROM dbo.ClassroomMemberships m INNER JOIN dbo.Classrooms c ON c.ClassID = m.ClassID WHERE m.MembershipID = ${requestId} AND m.Status = 'Pending' AND c.InstructorUserID = ${req.user.userId}`;
        if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Request not found for your classrooms.' });
        res.json({ success: true, status: 'Accepted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not accept join request.' });
    }
});

app.listen(3000, () => {
    console.log('Backend server is running on http://localhost:3000');
});