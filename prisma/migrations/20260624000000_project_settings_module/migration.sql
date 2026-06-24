-- Membership: job title + status + invited email + photo + timestamps
ALTER TABLE "Membership" ADD COLUMN "projectRole"  TEXT;
ALTER TABLE "Membership" ADD COLUMN "status"       TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Membership" ADD COLUMN "photoUrl"     TEXT;
ALTER TABLE "Membership" ADD COLUMN "invitedEmail" TEXT;
ALTER TABLE "Membership" ADD COLUMN "updatedAt"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Membership_workspaceId_status_idx"        ON "Membership"("workspaceId", "status");
CREATE INDEX "Membership_workspaceId_projectRole_idx"   ON "Membership"("workspaceId", "projectRole");

-- ProjectSmartGoal
CREATE TABLE "ProjectSmartGoal" (
    "id"          TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "specific"    TEXT,
    "measurable"  TEXT,
    "achievable"  TEXT,
    "relevant"    TEXT,
    "timeBound"   TEXT,
    "deadline"    TIMESTAMP(3),
    "version"     INTEGER NOT NULL DEFAULT 1,
    "smartScore"  DOUBLE PRECISION,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectSmartGoal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectSmartGoal_workspaceId_key" ON "ProjectSmartGoal"("workspaceId");
CREATE INDEX "ProjectSmartGoal_workspaceId_idx" ON "ProjectSmartGoal"("workspaceId");
ALTER TABLE "ProjectSmartGoal"
  ADD CONSTRAINT "ProjectSmartGoal_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SmartGoalVersion
CREATE TABLE "SmartGoalVersion" (
    "id"          TEXT NOT NULL,
    "smartGoalId" TEXT NOT NULL,
    "version"     INTEGER NOT NULL,
    "title"       TEXT NOT NULL,
    "specific"    TEXT,
    "measurable"  TEXT,
    "achievable"  TEXT,
    "relevant"    TEXT,
    "timeBound"   TEXT,
    "deadline"    TIMESTAMP(3),
    "smartScore"  DOUBLE PRECISION,
    "changedById" TEXT,
    "changeNote"  TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmartGoalVersion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmartGoalVersion_smartGoalId_version_idx" ON "SmartGoalVersion"("smartGoalId", "version");
ALTER TABLE "SmartGoalVersion"
  ADD CONSTRAINT "SmartGoalVersion_smartGoalId_fkey"
  FOREIGN KEY ("smartGoalId") REFERENCES "ProjectSmartGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProjectRole
CREATE TABLE "ProjectRole" (
    "id"       TEXT NOT NULL,
    "roleKey"  TEXT NOT NULL,
    "name"     TEXT NOT NULL,
    "category" TEXT,
    CONSTRAINT "ProjectRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectRole_roleKey_key" ON "ProjectRole"("roleKey");

-- ProjectMethodology
CREATE TABLE "ProjectMethodology" (
    "id"             TEXT NOT NULL,
    "workspaceId"    TEXT NOT NULL,
    "methodologyKey" TEXT NOT NULL,
    "tier"           TEXT NOT NULL DEFAULT 'secondary',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectMethodology_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectMethodology_workspaceId_methodologyKey_key"
  ON "ProjectMethodology"("workspaceId", "methodologyKey");
CREATE INDEX "ProjectMethodology_workspaceId_tier_idx" ON "ProjectMethodology"("workspaceId", "tier");
ALTER TABLE "ProjectMethodology"
  ADD CONSTRAINT "ProjectMethodology_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- KpiDefinition
CREATE TABLE "KpiDefinition" (
    "id"          TEXT NOT NULL,
    "kpiKey"      TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "formula"     TEXT NOT NULL,
    "dataSource"  TEXT NOT NULL,
    "frequency"   TEXT NOT NULL,
    CONSTRAINT "KpiDefinition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KpiDefinition_kpiKey_key" ON "KpiDefinition"("kpiKey");

-- ProjectKpi
CREATE TABLE "ProjectKpi" (
    "id"             TEXT NOT NULL,
    "workspaceId"    TEXT NOT NULL,
    "kpiKey"         TEXT NOT NULL,
    "enabled"        BOOLEAN NOT NULL DEFAULT true,
    "target"         DOUBLE PRECISION,
    "alertThreshold" DOUBLE PRECISION,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectKpi_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectKpi_workspaceId_kpiKey_key" ON "ProjectKpi"("workspaceId", "kpiKey");
CREATE INDEX "ProjectKpi_workspaceId_enabled_idx" ON "ProjectKpi"("workspaceId", "enabled");
ALTER TABLE "ProjectKpi"
  ADD CONSTRAINT "ProjectKpi_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProjectKpiSnapshot
CREATE TABLE "ProjectKpiSnapshot" (
    "id"           TEXT NOT NULL,
    "projectKpiId" TEXT NOT NULL,
    "value"        DOUBLE PRECISION NOT NULL,
    "capturedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectKpiSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectKpiSnapshot_projectKpiId_capturedAt_idx"
  ON "ProjectKpiSnapshot"("projectKpiId", "capturedAt");
ALTER TABLE "ProjectKpiSnapshot"
  ADD CONSTRAINT "ProjectKpiSnapshot_projectKpiId_fkey"
  FOREIGN KEY ("projectKpiId") REFERENCES "ProjectKpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProjectAiInsight
CREATE TABLE "ProjectAiInsight" (
    "id"          TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "severity"    TEXT,
    "title"       TEXT NOT NULL,
    "detail"      TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectAiInsight_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectAiInsight_workspaceId_type_idx" ON "ProjectAiInsight"("workspaceId", "type");
CREATE INDEX "ProjectAiInsight_createdAt_idx" ON "ProjectAiInsight"("createdAt");
ALTER TABLE "ProjectAiInsight"
  ADD CONSTRAINT "ProjectAiInsight_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProjectInvitation
CREATE TABLE "ProjectInvitation" (
    "id"          TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "projectRole" TEXT,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "invitedById" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectInvitation_workspaceId_email_key"
  ON "ProjectInvitation"("workspaceId", "email");
CREATE INDEX "ProjectInvitation_status_idx" ON "ProjectInvitation"("status");
ALTER TABLE "ProjectInvitation"
  ADD CONSTRAINT "ProjectInvitation_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AuditLog
CREATE TABLE "AuditLog" (
    "id"          TEXT NOT NULL,
    "workspaceId" TEXT,
    "actorId"     TEXT,
    "action"      TEXT NOT NULL,
    "entity"      TEXT NOT NULL,
    "entityId"    TEXT,
    "before"      TEXT,
    "after"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_workspaceId_entity_idx" ON "AuditLog"("workspaceId", "entity");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Seed KPI definitions catalog
INSERT INTO "KpiDefinition" ("id","kpiKey","name","description","formula","dataSource","frequency") VALUES
 (gen_random_uuid()::text,'task_completion_rate','Task Completion Rate','% de tareas completadas sobre las planificadas en el periodo.','completedTasks / plannedTasks * 100','Task tracker','sprint'),
 (gen_random_uuid()::text,'team_velocity','Team Velocity','Suma de puntos de historia completados por sprint.','sum(completedStoryPoints)','Sprint backlog','sprint'),
 (gen_random_uuid()::text,'response_time','Response Time','Tiempo medio de respuesta en canales del equipo.','avg(firstResponseTimestamp - messageTimestamp)','Chat / messaging','weekly'),
 (gen_random_uuid()::text,'collaboration_score','Collaboration Score','Índice de interacción y co-creación entre miembros.','weighted(messages + pairSessions + reviews)','Activity graph','weekly'),
 (gen_random_uuid()::text,'screen_time','Screen Time','Tiempo activo promedio en herramientas del proyecto.','avg(activeMinutes)','Productivity tools','weekly'),
 (gen_random_uuid()::text,'research_score','Research Score','Cobertura y calidad de la investigación de usuario.','(interviews + tests + insights) / planned','Research log','sprint'),
 (gen_random_uuid()::text,'sprint_burndown','Sprint Burndown','Desviación del trabajo restante frente al ideal del sprint.','remaining - idealRemaining','Sprint backlog','sprint'),
 (gen_random_uuid()::text,'customer_satisfaction','Customer Satisfaction','Satisfacción reportada por clientes/usuarios.','avg(csatScore) * 20','CSAT surveys','monthly'),
 (gen_random_uuid()::text,'defect_density','Defect Density','Defects por unidad de tamaño entregada.','defects / kloc','Issue tracker','sprint'),
 (gen_random_uuid()::text,'lead_time','Lead Time','Tiempo desde la creación hasta la entrega de un item.','avg(deliveredAt - createdAt)','Issue tracker','weekly'),
 (gen_random_uuid()::text,'cycle_time','Cycle Time','Tiempo desde que el trabajo inicia hasta que se entrega.','avg(deliveredAt - startedAt)','Issue tracker','weekly');

-- Seed project roles catalog
INSERT INTO "ProjectRole" ("id","roleKey","name","category") VALUES
 (gen_random_uuid()::text,'project_manager','Project Manager','leadership'),
 (gen_random_uuid()::text,'product_owner','Product Owner','product'),
 (gen_random_uuid()::text,'scrum_master','Scrum Master','leadership'),
 (gen_random_uuid()::text,'ux_designer','UX Designer','design'),
 (gen_random_uuid()::text,'ui_designer','UI Designer','design'),
 (gen_random_uuid()::text,'backend_developer','Backend Developer','engineering'),
 (gen_random_uuid()::text,'frontend_developer','Frontend Developer','engineering'),
 (gen_random_uuid()::text,'full_stack_developer','Full Stack Developer','engineering'),
 (gen_random_uuid()::text,'qa_engineer','QA Engineer','quality'),
 (gen_random_uuid()::text,'data_analyst','Data Analyst','data'),
 (gen_random_uuid()::text,'business_analyst','Business Analyst','data'),
 (gen_random_uuid()::text,'stakeholder','Stakeholder','stakeholder');
