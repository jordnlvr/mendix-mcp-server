# Platform SDK & Model SDK - Studio Pro 11+ Reference

## Deep Beast Mode Research Harvest - January 2025

> **Status**: RESEARCH STAGING - Needs validation before adding to knowledge base
> **Source**: Official Mendix Docs + Working examples
> **Target**: Studio Pro 11+ SDK

---

## 1. Quick Start Setup

### Prerequisites

- Node.js 18+
- TypeScript
- Mendix Platform Account
- Personal Access Token (PAT)

### Project Setup

```bash
mkdir mendix-sdk-project
cd mendix-sdk-project
npm init -y
npm install mendixplatformsdk mendixmodelsdk typescript ts-node
npx tsc --init
```

### Environment Setup

Set `MENDIX_TOKEN` environment variable with your PAT:

```powershell
# PowerShell
$env:MENDIX_TOKEN = "your-personal-access-token"
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 2. Core Connection Patterns

### 2.1 Connect to Existing App

```typescript
import { MendixPlatformClient } from 'mendixplatformsdk';

async function main() {
  const client = new MendixPlatformClient();

  // Get app by App ID (GUID)
  const app = client.getApp('cc22bea9-68d6-4f88-8123-fc358c2fe4b3');

  // Create temporary working copy from branch
  const workingCopy = await app.createTemporaryWorkingCopy('main');

  // Open model for manipulation
  const model = await workingCopy.openModel();

  // ... do work ...

  // Commit changes
  await model.flushChanges();
  await workingCopy.commitToRepository('main', {
    commitMessage: 'SDK: Automated changes',
  });
}

main().catch(console.error);
```

### 2.2 Create New App

```typescript
async function createNewApp() {
  const client = new MendixPlatformClient();

  const app = await client.createNewApp(`MyApp-${Date.now()}`, {
    repositoryType: 'git',
  });

  const workingCopy = await app.createTemporaryWorkingCopy('main');
  const model = await workingCopy.openModel();

  // App is now ready for manipulation
  return { app, workingCopy, model };
}
```

### 2.3 Reuse Existing Working Copy

```typescript
// More efficient - reuse existing working copy
async function reuseWorkingCopy(appId: string, workingCopyId: string) {
  const client = new MendixPlatformClient();
  const app = client.getApp(appId);

  // Get existing working copy instead of creating new
  const workingCopy = await app.getOnlineWorkingCopy(workingCopyId);
  const model = await workingCopy.openModel();

  return { workingCopy, model };
}
```

---

## 3. Working with Domain Models

### 3.1 Find Domain Model

```typescript
import { domainmodels } from 'mendixmodelsdk';

async function getDomainModel(model: IModel, moduleName: string) {
  // Find module's domain model interface
  const dmInterface = model
    .allDomainModels()
    .filter((dm) => dm.containerAsModule.name === moduleName)[0];

  if (!dmInterface) {
    throw new Error(`Module ${moduleName} not found`);
  }

  // Load full domain model
  const domainModel = await dmInterface.load();
  return domainModel;
}
```

### 3.2 Create Entity

```typescript
async function createEntity(
  domainModel: domainmodels.DomainModel,
  name: string,
  x: number = 100,
  y: number = 100
) {
  const entity = domainmodels.Entity.createIn(domainModel);
  entity.name = name;
  entity.location = { x, y };

  // Documentation
  entity.documentation = `Entity ${name} created via SDK`;

  return entity;
}
```

### 3.3 Create Attribute

```typescript
function createAttribute(
  entity: domainmodels.Entity,
  name: string,
  type: 'String' | 'Integer' | 'Long' | 'Decimal' | 'Boolean' | 'DateTime' | 'AutoNumber'
) {
  const attribute = domainmodels.Attribute.createIn(entity);
  attribute.name = name;

  // Set attribute type
  switch (type) {
    case 'String':
      const stringType = domainmodels.StringAttributeType.create(entity.model);
      stringType.length = 200;
      attribute.type = stringType;
      break;
    case 'Integer':
      attribute.type = domainmodels.IntegerAttributeType.create(entity.model);
      break;
    case 'Long':
      attribute.type = domainmodels.LongAttributeType.create(entity.model);
      break;
    case 'Decimal':
      attribute.type = domainmodels.DecimalAttributeType.create(entity.model);
      break;
    case 'Boolean':
      attribute.type = domainmodels.BooleanAttributeType.create(entity.model);
      break;
    case 'DateTime':
      attribute.type = domainmodels.DateTimeAttributeType.create(entity.model);
      break;
    case 'AutoNumber':
      attribute.type = domainmodels.AutoNumberAttributeType.create(entity.model);
      break;
  }

  return attribute;
}
```

### 3.4 Create Association

```typescript
function createAssociation(
  domainModel: domainmodels.DomainModel,
  name: string,
  parentEntity: domainmodels.Entity, // Many side
  childEntity: domainmodels.Entity, // One side
  associationType: 'Reference' | 'ReferenceSet' = 'Reference'
) {
  const association = domainmodels.Association.createIn(domainModel);
  association.name = name;
  association.parent = parentEntity;
  association.child = childEntity;

  // Set type
  if (associationType === 'ReferenceSet') {
    association.type = domainmodels.AssociationType.ReferenceSet;
  } else {
    association.type = domainmodels.AssociationType.Reference;
  }

  // Visual positioning
  association.parentConnection = { x: 100, y: 30 };
  association.childConnection = { x: 0, y: 30 };

  return association;
}
```

### 3.5 Set Generalization (Inheritance)

```typescript
async function setGeneralization(
  model: IModel,
  entity: domainmodels.Entity,
  parentQualifiedName: string // e.g., "Administration.Account"
) {
  const parentEntity = model.findEntityByQualifiedName(parentQualifiedName);

  if (!parentEntity) {
    throw new Error(`Parent entity ${parentQualifiedName} not found`);
  }

  const generalization = domainmodels.Generalization.createIn(entity);
  generalization.generalization = parentEntity;

  return generalization;
}
```

---

## 4. Working with Microflows

### 4.1 Find Microflow

```typescript
import { microflows } from 'mendixmodelsdk';

async function getMicroflow(model: IModel, qualifiedName: string) {
  const mfInterface = model.allMicroflows().filter((mf) => mf.qualifiedName === qualifiedName)[0];

  if (!mfInterface) {
    throw new Error(`Microflow ${qualifiedName} not found`);
  }

  return await mfInterface.load();
}
```

### 4.2 Create Microflow

```typescript
async function createMicroflow(model: IModel, moduleName: string, microflowName: string) {
  const folder = model.allFolders().filter((f) => f.containerAsModule.name === moduleName)[0];

  // OR create in module directly
  const module = model.allModules().filter((m) => m.name === moduleName)[0];

  const mf = microflows.Microflow.createIn(module);
  mf.name = microflowName;

  // Create start event
  const startEvent = microflows.StartEvent.createIn(mf);
  startEvent.relativeMiddlePoint = { x: 100, y: 100 };

  // Create end event
  const endEvent = microflows.EndEvent.createIn(mf);
  endEvent.relativeMiddlePoint = { x: 500, y: 100 };

  // Connect start to end with sequence flow
  const flow = microflows.SequenceFlow.createIn(mf);
  flow.origin = startEvent;
  flow.destination = endEvent;

  return mf;
}
```

### 4.3 Add Activities to Microflow

```typescript
// Helper to insert activity between two points
function insertActivity(
  mf: microflows.Microflow,
  activity: microflows.MicroflowObject,
  previousObject: microflows.MicroflowObject,
  nextObject: microflows.MicroflowObject
) {
  // Find and remove existing flow
  const existingFlow = mf.flows.find(
    (f) =>
      f instanceof microflows.SequenceFlow &&
      (f as microflows.SequenceFlow).origin === previousObject &&
      (f as microflows.SequenceFlow).destination === nextObject
  ) as microflows.SequenceFlow;

  if (existingFlow) {
    existingFlow.delete();
  }

  // Create flow from previous to activity
  const flow1 = microflows.SequenceFlow.createIn(mf);
  flow1.origin = previousObject;
  flow1.destination = activity;

  // Create flow from activity to next
  const flow2 = microflows.SequenceFlow.createIn(mf);
  flow2.origin = activity;
  flow2.destination = nextObject;
}
```

### 4.4 Create Log Message Activity

```typescript
function createLogActivity(
  mf: microflows.Microflow,
  message: string,
  level: 'Info' | 'Warning' | 'Error' | 'Debug' | 'Trace' = 'Info',
  x: number = 250,
  y: number = 100
) {
  const logAction = microflows.LogMessageAction.createIn(mf);
  logAction.relativeMiddlePoint = { x, y };

  // Set log level
  switch (level) {
    case 'Info':
      logAction.level = microflows.LogLevel.Info;
      break;
    case 'Warning':
      logAction.level = microflows.LogLevel.Warning;
      break;
    case 'Error':
      logAction.level = microflows.LogLevel.Error;
      break;
    case 'Debug':
      logAction.level = microflows.LogLevel.Debug;
      break;
    case 'Trace':
      logAction.level = microflows.LogLevel.Trace;
      break;
  }

  // Set message template
  const template = microflows.StringTemplate.create(mf.model);
  const textPart = microflows.TextTemplate.create(mf.model);
  textPart.text = message;
  template.parts.push(textPart);
  logAction.messageTemplate = template;

  // Set log node (module prefix)
  logAction.node = `@${mf.containerAsModule.name}.Log\n`;

  return logAction;
}
```

### 4.5 Create Retrieve Activity

```typescript
async function createRetrieveActivity(
  model: IModel,
  mf: microflows.Microflow,
  entityQualifiedName: string,
  variableName: string,
  x: number = 250,
  y: number = 100
) {
  const entity = model.findEntityByQualifiedName(entityQualifiedName);
  if (!entity) throw new Error(`Entity ${entityQualifiedName} not found`);

  const retrieveAction = microflows.RetrieveAction.createIn(mf);
  retrieveAction.relativeMiddlePoint = { x, y };
  retrieveAction.outputVariableName = variableName;

  // Set retrieve source (database)
  const dbSource = microflows.DatabaseRetrieveSource.create(model);
  dbSource.entity = entity;

  // XPath constraint (optional)
  // dbSource.xPathConstraint = "[Active = true()]";

  retrieveAction.retrieveSource = dbSource;

  return retrieveAction;
}
```

### 4.6 Create Change Object Activity

```typescript
function createChangeObjectActivity(
  mf: microflows.Microflow,
  variableName: string,
  commit: 'Yes' | 'No' | 'YesWithoutEvents' = 'Yes',
  x: number = 250,
  y: number = 100
) {
  const changeAction = microflows.ChangeObjectAction.createIn(mf);
  changeAction.relativeMiddlePoint = { x, y };
  changeAction.changeVariableName = variableName;

  // Set commit
  switch (commit) {
    case 'Yes':
      changeAction.commit = microflows.CommitEnum.Yes;
      break;
    case 'No':
      changeAction.commit = microflows.CommitEnum.No;
      break;
    case 'YesWithoutEvents':
      changeAction.commit = microflows.CommitEnum.YesWithoutEvents;
      break;
  }

  return changeAction;
}

// Add attribute change to ChangeObjectAction
function addMemberChange(
  changeAction: microflows.ChangeObjectAction,
  attributeName: string,
  value: string // Expression
) {
  const memberChange = microflows.MemberChange.create(changeAction.model);
  memberChange.attribute = changeAction.model.findAttributeByQualifiedName(
    `${changeAction.changeVariableName}/${attributeName}`
  )!;
  memberChange.value = value;
  changeAction.items.push(memberChange);
}
```

### 4.7 Create Create Object Activity

```typescript
async function createCreateObjectActivity(
  model: IModel,
  mf: microflows.Microflow,
  entityQualifiedName: string,
  variableName: string,
  x: number = 250,
  y: number = 100
) {
  const entity = model.findEntityByQualifiedName(entityQualifiedName);
  if (!entity) throw new Error(`Entity ${entityQualifiedName} not found`);

  const createAction = microflows.CreateObjectAction.createIn(mf);
  createAction.relativeMiddlePoint = { x, y };
  createAction.entity = entity;
  createAction.outputVariableName = variableName;

  return createAction;
}
```

### 4.8 Create Aggregate List Activity (for counting)

```typescript
async function createAggregateListActivity(
  model: IModel,
  mf: microflows.Microflow,
  listVariableName: string,
  outputVariableName: string,
  aggregateFunction: 'Count' | 'Sum' | 'Average' | 'Min' | 'Max' = 'Count',
  x: number = 250,
  y: number = 100
) {
  const aggregateAction = microflows.AggregateListAction.createIn(mf);
  aggregateAction.relativeMiddlePoint = { x, y };
  aggregateAction.inputListVariableName = listVariableName;
  aggregateAction.outputVariableName = outputVariableName;

  // Set aggregate function
  switch (aggregateFunction) {
    case 'Count':
      aggregateAction.aggregateFunction = microflows.AggregateFunctionEnum.Count;
      break;
    case 'Sum':
      aggregateAction.aggregateFunction = microflows.AggregateFunctionEnum.Sum;
      break;
    case 'Average':
      aggregateAction.aggregateFunction = microflows.AggregateFunctionEnum.Average;
      break;
    case 'Min':
      aggregateAction.aggregateFunction = microflows.AggregateFunctionEnum.Min;
      break;
    case 'Max':
      aggregateAction.aggregateFunction = microflows.AggregateFunctionEnum.Max;
      break;
  }

  return aggregateAction;
}
```

### 4.9 Create Loop Activity

```typescript
function createLoopActivity(
  mf: microflows.Microflow,
  listVariableName: string,
  iteratorVariableName: string,
  x: number = 250,
  y: number = 100
) {
  const loop = microflows.LoopedActivity.createIn(mf);
  loop.relativeMiddlePoint = { x, y };

  // IMPORTANT: Use IterableList on loopSource (NOT deprecated loopVariableName)
  const iterableList = microflows.IterableList.create(mf.model);
  iterableList.listVariableName = listVariableName;
  iterableList.variableName = iteratorVariableName;
  loop.loopSource = iterableList;

  return loop;
}
```

---

## 5. Working with Documentation

### 5.1 Set Entity Documentation

```typescript
function setEntityDocumentation(entity: domainmodels.Entity, doc: string) {
  entity.documentation = doc;
}
```

### 5.2 Set Microflow Documentation

```typescript
function setMicroflowDocumentation(mf: microflows.Microflow, doc: string) {
  mf.documentation = doc;
}
```

### 5.3 Batch Apply Documentation

```typescript
interface DocItem {
  qualifiedName: string;
  documentation: string;
}

async function applyDocumentation(model: IModel, items: DocItem[]) {
  for (const item of items) {
    // Try entity first
    const entityInterface = model.allEntities().find((e) => e.qualifiedName === item.qualifiedName);

    if (entityInterface) {
      const entity = await entityInterface.load();
      entity.documentation = item.documentation;
      continue;
    }

    // Try microflow
    const mfInterface = model.allMicroflows().find((mf) => mf.qualifiedName === item.qualifiedName);

    if (mfInterface) {
      const mf = await mfInterface.load();
      mf.documentation = item.documentation;
      continue;
    }

    console.warn(`Could not find: ${item.qualifiedName}`);
  }
}
```

---

## 6. Working with Pages

### 6.1 Find Page

```typescript
import { pages } from 'mendixmodelsdk';

async function getPage(model: IModel, qualifiedName: string) {
  const pageInterface = model.allPages().filter((p) => p.qualifiedName === qualifiedName)[0];

  if (!pageInterface) {
    throw new Error(`Page ${qualifiedName} not found`);
  }

  return await pageInterface.load();
}
```

### 6.2 Create Simple Page

```typescript
async function createPage(model: IModel, moduleName: string, pageName: string, title: string) {
  const module = model.allModules().filter((m) => m.name === moduleName)[0];

  const page = pages.Page.createIn(module);
  page.name = pageName;
  page.title = title;

  // Create basic layout container
  const layout = pages.LayoutContainer.createIn(page);
  // ... configure layout

  return page;
}
```

---

## 7. Finding Things in the Model

### 7.1 By Qualified Name

```typescript
// Find entity
const entity = model.findEntityByQualifiedName('MyModule.Customer');

// Find attribute
const attribute = model.findAttributeByQualifiedName('MyModule.Customer.Name');

// Find association
const association = model.findAssociationByQualifiedName('MyModule.Customer_Order');
```

### 7.2 Filter All

```typescript
// All entities in a module
const moduleEntities = model
  .allEntities()
  .filter((e) => e.containerAsDomainModel.containerAsModule.name === 'MyModule');

// All microflows with prefix
const actionMicroflows = model.allMicroflows().filter((mf) => mf.name.startsWith('ACT_'));

// All pages
const allPages = model.allPages();
```

### 7.3 Traverse Loaded Elements

```typescript
async function findAttributeByName(entity: domainmodels.Entity, attributeName: string) {
  return entity.attributes.find((a) => a.name === attributeName);
}

async function findAssociationsByEntity(domainModel: domainmodels.DomainModel, entityName: string) {
  return domainModel.associations.filter(
    (a) => a.parent.name === entityName || a.child.name === entityName
  );
}
```

---

## 8. Security & Module Roles

### 8.1 Set Allowed Module Roles for Microflow

```typescript
async function setMicroflowSecurity(
  model: IModel,
  mf: microflows.Microflow,
  roleNames: string[] // e.g., ["Administrator", "User"]
) {
  const moduleSecurity = await model
    .allModuleSecurities()
    .filter((ms) => ms.containerAsModule.name === mf.containerAsModule.name)[0]
    .load();

  const roles = moduleSecurity.moduleRoles.filter((r) => roleNames.includes(r.name));

  // Clear existing and set new
  mf.allowedModuleRoles.clear();
  roles.forEach((r) => mf.allowedModuleRoles.push(r));
}
```

---

## 9. Error Handling & Best Practices

### 9.1 Always Flush Changes

```typescript
try {
  // ... make changes ...

  await model.flushChanges();
  await workingCopy.commitToRepository('main', {
    commitMessage: 'SDK: Changes applied',
  });
} catch (error) {
  console.error('Failed to commit:', error);
  // Working copy remains - can retry
}
```

### 9.2 Delete Flows Before Activities

When modifying microflows, delete related flows FIRST:

```typescript
function deleteActivitySafely(mf: microflows.Microflow, activity: microflows.MicroflowObject) {
  // Find and delete all connected flows first
  const connectedFlows = mf.flows.filter((f) => {
    if (f instanceof microflows.SequenceFlow) {
      const sf = f as microflows.SequenceFlow;
      return sf.origin === activity || sf.destination === activity;
    }
    return false;
  });

  connectedFlows.forEach((f) => f.delete());

  // Now safe to delete activity
  activity.delete();
}
```

### 9.3 Load Before Modify

```typescript
// BAD - interface doesn't have all properties
const entityInterface = model.allEntities()[0];
entityInterface.name = 'NewName'; // May fail!

// GOOD - load first
const entity = await model.allEntities()[0].load();
entity.name = 'NewName'; // Works!
```

---

## 10. Complete Example: Create CRUD Microflows

```typescript
import { MendixPlatformClient } from 'mendixplatformsdk';
import { microflows, domainmodels } from 'mendixmodelsdk';

async function createCrudMicroflows(appId: string, moduleName: string, entityName: string) {
  const client = new MendixPlatformClient();
  const app = client.getApp(appId);
  const workingCopy = await app.createTemporaryWorkingCopy('main');
  const model = await workingCopy.openModel();

  const entityQualifiedName = `${moduleName}.${entityName}`;

  // Create microflow
  const createMf = await createBaseMicroflow(model, moduleName, `ACT_${entityName}_Create`);
  await addCreateLogic(model, createMf, entityQualifiedName);

  // Read microflow
  const readMf = await createBaseMicroflow(model, moduleName, `DS_${entityName}_GetAll`);
  await addRetrieveLogic(model, readMf, entityQualifiedName);

  // Update microflow
  const updateMf = await createBaseMicroflow(model, moduleName, `ACT_${entityName}_Save`);
  await addCommitLogic(model, updateMf, entityQualifiedName);

  // Delete microflow
  const deleteMf = await createBaseMicroflow(model, moduleName, `ACT_${entityName}_Delete`);
  await addDeleteLogic(model, deleteMf, entityQualifiedName);

  // Commit
  await model.flushChanges();
  await workingCopy.commitToRepository('main', {
    commitMessage: `SDK: Created CRUD microflows for ${entityName}`,
  });

  console.log('Done!');
}

// Run
createCrudMicroflows('cc22bea9-68d6-4f88-8123-fc358c2fe4b3', 'MyModule', 'Customer').catch(
  console.error
);
```

---

## 11. Known Issues & Workarounds

| Issue                             | Workaround                                                 |
| --------------------------------- | ---------------------------------------------------------- |
| `length()` function doesn't exist | Use `AggregateListAction` with Count                       |
| Loop iteration variable error     | Use `IterableList` on `loopSource`, not `loopVariableName` |
| Flow deletion order               | Always delete flows before deleting activities             |
| Working copy timeout              | Reuse existing working copies when possible                |
| Rate limiting                     | Add delays between API calls                               |

---

## 12. Sources

- https://docs.mendix.com/apidocs-mxsdk/mxsdk/sdk-howtos/
- https://docs.mendix.com/apidocs-mxsdk/mxsdk/creating-your-first-script/
- https://docs.mendix.com/apidocs-mxsdk/mxsdk/creating-the-domain-model/
- https://docs.mendix.com/apidocs-mxsdk/mxsdk/changing-things-in-the-model/
- https://docs.mendix.com/apidocs-mxsdk/mxsdk/finding-things-in-the-model/
- https://apidocs.rnd.mendix.com/modelsdk/latest/index.html

---

**Next Steps for Validation:**

1. Test all patterns against SP11.5 model
2. Verify microflow activity creation order
3. Test security role assignment
4. Validate page creation APIs
