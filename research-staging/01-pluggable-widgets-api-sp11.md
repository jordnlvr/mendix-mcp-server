# Pluggable Widgets API - Studio Pro 11+ Reference

## Deep Beast Mode Research Harvest - January 2025

> **Status**: RESEARCH STAGING - Needs validation before adding to knowledge base
> **Source**: Official Mendix Docs + mendix/web-widgets GitHub repo
> **Target**: Studio Pro 11+

---

## 1. Core Type Imports

All pluggable widgets import from the `mendix` package:

```typescript
import {
  // Editable values (two-way binding)
  EditableValue,

  // Dynamic values (read-only from expressions/attributes)
  DynamicValue,

  // Actions
  ActionValue,

  // Lists and datasources
  ListValue,
  ListAttributeValue,
  ListActionValue,
  ListExpressionValue,
  ListWidgetValue,

  // References/Associations
  ReferenceValue,
  ReferenceSetValue,
  ListReferenceValue,
  ListReferenceSetValue,

  // Selection
  SelectionSingleValue,
  SelectionMultiValue,

  // Objects
  ObjectItem,

  // Files and images
  FileValue,
  WebImage,
  NativeImage,
  WebIcon,
  NativeIcon,
} from 'mendix';

// For decimal handling
import { Big } from 'big.js';
```

---

## 2. Property Types Reference

### 2.1 EditableValue<T>

Two-way binding to an attribute. User can read AND write.

```typescript
interface EditableValue<T> {
  value: T | undefined;
  displayValue: string;
  status: 'available' | 'loading' | 'unavailable';
  validation?: string;
  readOnly: boolean;

  // Methods
  setValue(value: T): void;
  setValidator(validator: (value: T | undefined) => string | undefined): void;
}

// Usage in component:
function MyWidget({ valueAttribute }: { valueAttribute: EditableValue<string> }) {
  if (valueAttribute.status !== 'available') return <Loading />;

  const handleChange = (newValue: string) => {
    valueAttribute.setValue(newValue);
  };

  return (
    <input
      value={valueAttribute.value ?? ''}
      onChange={(e) => handleChange(e.target.value)}
      readOnly={valueAttribute.readOnly}
    />
  );
}
```

### 2.2 DynamicValue<T>

Read-only value from expression or attribute.

```typescript
interface DynamicValue<T> {
  value: T | undefined;
  status: 'available' | 'loading' | 'unavailable';
}

// Usage:
function MyLabel({ caption }: { caption: DynamicValue<string> }) {
  return <span>{caption.value ?? 'Loading...'}</span>;
}
```

### 2.3 ActionValue

Trigger a microflow, nanoflow, or other action.

```typescript
interface ActionValue {
  canExecute: boolean;
  isExecuting: boolean;
  execute(): void;
}

// PATTERN: Safe action execution
function executeAction(action?: ActionValue): void {
  if (action?.canExecute && !action.isExecuting) {
    action.execute();
  }
}

// Usage:
function MyButton({ onClick }: { onClick?: ActionValue }) {
  return (
    <button onClick={() => executeAction(onClick)} disabled={!onClick?.canExecute}>
      Click Me
    </button>
  );
}
```

---

## 3. ListValue API (Datasources)

The most powerful and complex API for working with lists of objects.

```typescript
interface ListValue {
  // Status
  status: 'available' | 'loading' | 'unavailable';

  // Items
  items?: ObjectItem[];
  hasMoreItems?: boolean;
  totalCount?: number;

  // Pagination
  limit: number;
  offset: number;
  setLimit(limit: number): void;
  setOffset(offset: number): void;

  // Sorting
  sortOrder: SortInstruction[];
  setSortOrder(sort: SortInstruction[]): void;

  // Filtering
  filter: FilterCondition | undefined;
  setFilter(filter: FilterCondition | undefined): void;

  // Reload
  reload(): void;
}

// Sort instruction
interface SortInstruction {
  id: string; // Attribute ID
  direction: 'asc' | 'desc';
}
```

### 3.1 ListAttributeValue<T>

Access attribute values for list items.

```typescript
interface ListAttributeValue<T> {
  id: string;
  sortable: boolean;
  filterable: boolean;
  type: string;
  formatter: ValueFormatter<T>;
  universe?: T[]; // For enumerations

  get(item: ObjectItem): DynamicValue<T>;
}

// Usage in list:
function renderItems(items: ObjectItem[], nameAttr: ListAttributeValue<string>) {
  return items.map((item) => <div key={item.id}>{nameAttr.get(item).value}</div>);
}
```

### 3.2 ListActionValue

Execute actions per list item.

```typescript
interface ListActionValue {
  get(item: ObjectItem): ActionValue | undefined;
}

// Usage:
function ItemRow({ item, onDelete }: { item: ObjectItem; onDelete: ListActionValue }) {
  const action = onDelete.get(item);
  return (
    <button onClick={() => executeAction(action)} disabled={!action?.canExecute}>
      Delete
    </button>
  );
}
```

### 3.3 ListWidgetValue

Render nested widgets per list item.

```typescript
interface ListWidgetValue {
  get(item: ObjectItem): ReactNode;
}

// Usage:
function MyGallery({ items, content }: { items: ObjectItem[]; content: ListWidgetValue }) {
  return (
    <div className="gallery">
      {items.map((item) => (
        <div key={item.id} className="gallery-item">
          {content.get(item)}
        </div>
      ))}
    </div>
  );
}
```

### 3.4 ListExpressionValue<T>

Evaluate expressions per list item.

```typescript
interface ListExpressionValue<T> {
  get(item: ObjectItem): DynamicValue<T>;
}
```

---

## 4. Filter Builders

Build filter conditions programmatically:

```typescript
import {
  attribute,
  literal,
  equals,
  notEqual,
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  contains,
  startsWith,
  endsWith,
  and,
  or,
  not,
} from 'mendix/filters/builders';

// Example: Filter where name contains "John" AND age > 21
const filter = and(
  contains(attribute('Name'), literal('John')),
  greaterThan(attribute('Age'), literal(21))
);

datasource.setFilter(filter);

// Example: Filter with OR
const searchFilter = or(
  contains(attribute('FirstName'), literal(searchTerm)),
  contains(attribute('LastName'), literal(searchTerm)),
  contains(attribute('Email'), literal(searchTerm))
);
```

---

## 5. Widget XML Schema

Every pluggable widget needs a `.xml` definition file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<widget id="company.widgets.MyWidget"
        pluginWidget="true"
        needsEntityContext="true"
        offlineCapable="true"
        supportedPlatform="Web"
        xmlns="http://www.mendix.com/widget/1.0/"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.mendix.com/widget/1.0/ ../xsd/widget.xsd">

    <name>My Widget</name>
    <description>Widget description</description>

    <properties>
        <propertyGroup caption="General">
            <!-- String property -->
            <property key="label" type="string" required="true">
                <caption>Label</caption>
                <description>The label text</description>
            </property>

            <!-- Attribute (editable) -->
            <property key="valueAttribute" type="attribute" required="true">
                <caption>Value</caption>
                <description>The attribute to bind</description>
                <attributeTypes>
                    <attributeType name="String"/>
                    <attributeType name="Integer"/>
                    <attributeType name="Decimal"/>
                </attributeTypes>
            </property>

            <!-- Expression (read-only) -->
            <property key="displayExpression" type="expression" required="false">
                <caption>Display Expression</caption>
                <description>Expression for display</description>
                <returnType type="String"/>
            </property>

            <!-- Action -->
            <property key="onClick" type="action" required="false">
                <caption>On Click</caption>
                <description>Action to execute on click</description>
            </property>

            <!-- Datasource with nested properties -->
            <property key="datasource" type="datasource" isList="true" required="true">
                <caption>Data source</caption>
                <description>List of items</description>
            </property>

            <property key="itemContent" type="widgets" dataSource="datasource" required="true">
                <caption>Content</caption>
                <description>Content to render per item</description>
            </property>

            <property key="itemAttribute" type="attribute" dataSource="datasource" required="true">
                <caption>Display Attribute</caption>
                <description>Attribute to display</description>
                <attributeTypes>
                    <attributeType name="String"/>
                </attributeTypes>
            </property>

            <!-- Enumeration -->
            <property key="displayMode" type="enumeration" defaultValue="list">
                <caption>Display Mode</caption>
                <description>How to display items</description>
                <enumerationValues>
                    <enumerationValue key="list">List</enumerationValue>
                    <enumerationValue key="grid">Grid</enumerationValue>
                    <enumerationValue key="carousel">Carousel</enumerationValue>
                </enumerationValues>
            </property>

            <!-- Boolean -->
            <property key="showHeader" type="boolean" defaultValue="true">
                <caption>Show Header</caption>
                <description>Whether to show the header</description>
            </property>

            <!-- Integer -->
            <property key="pageSize" type="integer" defaultValue="10">
                <caption>Page Size</caption>
                <description>Items per page</description>
            </property>

            <!-- Icon -->
            <property key="icon" type="icon" required="false">
                <caption>Icon</caption>
                <description>Icon to display</description>
            </property>

            <!-- Image -->
            <property key="image" type="image" required="false">
                <caption>Image</caption>
                <description>Image to display</description>
            </property>

            <!-- File -->
            <property key="file" type="file" required="false">
                <caption>File</caption>
                <description>File to use</description>
            </property>

            <!-- Selection -->
            <property key="selection" type="selection" selectableObjects="datasource" required="false">
                <caption>Selection</caption>
                <description>Selected items</description>
            </property>
        </propertyGroup>

        <propertyGroup caption="Events">
            <property key="onSelectionChange" type="action" required="false">
                <caption>On Selection Change</caption>
                <description>Triggered when selection changes</description>
            </property>
        </propertyGroup>

        <propertyGroup caption="System Properties">
            <systemProperty key="Label"/>
            <systemProperty key="TabIndex"/>
        </propertyGroup>
    </properties>
</widget>
```

---

## 6. Generated TypeScript Types

The widget XML generates TypeScript types automatically:

```typescript
// typings/MyWidgetProps.d.ts (auto-generated)
import { CSSProperties, ReactNode } from 'react';
import {
  ActionValue,
  DynamicValue,
  EditableValue,
  ListValue,
  ListAttributeValue,
  ListWidgetValue,
  SelectionSingleValue,
  SelectionMultiValue,
  WebIcon,
} from 'mendix';
import { Big } from 'big.js';

export type DisplayModeEnum = 'list' | 'grid' | 'carousel';

export interface MyWidgetContainerProps {
  name: string;
  class: string;
  style?: CSSProperties;
  tabIndex?: number;

  // Properties from XML
  label: string;
  valueAttribute: EditableValue<string | Big>;
  displayExpression?: DynamicValue<string>;
  onClick?: ActionValue;
  datasource: ListValue;
  itemContent: ListWidgetValue;
  itemAttribute: ListAttributeValue<string>;
  displayMode: DisplayModeEnum;
  showHeader: boolean;
  pageSize: number;
  icon?: DynamicValue<WebIcon>;
  image?: DynamicValue<WebImage>;
  file?: DynamicValue<FileValue>;
  selection?: SelectionSingleValue | SelectionMultiValue;
  onSelectionChange?: ActionValue;
}

// Preview props for Studio Pro
export interface MyWidgetPreviewProps {
  className: string;
  style: string;
  styleObject?: CSSProperties;
  readOnly: boolean;
  // ... preview versions of all props
}
```

---

## 7. Editor Configuration (editorConfig.ts)

Control widget behavior in Studio Pro:

```typescript
import { MyWidgetPreviewProps } from '../typings/MyWidgetProps';

export type Platform = 'web' | 'desktop';

export type Properties = PropertyGroup[];

type PropertyGroup = {
  caption: string;
  propertyGroups?: PropertyGroup[];
  properties?: Property[];
};

type Property = {
  key: string;
  caption: string;
  description?: string;
};

export type Problem = {
  property?: string;
  severity?: 'error' | 'warning' | 'deprecation';
  message: string;
  url?: string;
};

// Control which properties are visible based on other property values
export function getProperties(
  values: MyWidgetPreviewProps,
  defaultProperties: Properties
): Properties {
  // Hide pageSize if displayMode is carousel
  if (values.displayMode === 'carousel') {
    defaultProperties = defaultProperties.filter(
      (group) => !group.properties?.some((p) => p.key === 'pageSize')
    );
  }
  return defaultProperties;
}

// Validate property values
export function check(values: MyWidgetPreviewProps): Problem[] {
  const errors: Problem[] = [];

  if (values.pageSize < 1 || values.pageSize > 100) {
    errors.push({
      property: 'pageSize',
      severity: 'error',
      message: 'Page size must be between 1 and 100',
    });
  }

  return errors;
}

// Custom preview caption
export function getCustomCaption(values: MyWidgetPreviewProps): string {
  return values.label || 'My Widget';
}

// Structure mode preview
export function getPreview(values: MyWidgetPreviewProps, isDarkMode: boolean): PreviewProps {
  return {
    type: 'Container',
    children: [{ type: 'Text', content: values.label }],
  };
}
```

---

## 8. Real Widget Examples from mendix/web-widgets

### 8.1 BadgeButton Pattern

```typescript
import { createElement, useCallback, ReactNode } from 'react';
import { BadgeButtonContainerProps } from '../typings/BadgeButtonProps';

// Helper for safe action execution
function executeAction(action?: ActionValue): void {
  if (action?.canExecute && !action.isExecuting) {
    action.execute();
  }
}

// Helper for checking value availability
function isAvailable<T>(value: DynamicValue<T> | EditableValue<T>): boolean {
  return value.status === 'available' && value.value !== undefined;
}

export function BadgeButton(props: BadgeButtonContainerProps): ReactNode {
  const onClick = useCallback(() => {
    executeAction(props.onClickEvent);
  }, [props.onClickEvent]);

  return (
    <button
      className={props.class}
      onClick={onClick}
      style={props.style}
      disabled={!props.onClickEvent?.canExecute}
    >
      <span className="badge-label">{isAvailable(props.label) ? props.label.value : ''}</span>
      <span className="badge-value">{isAvailable(props.value) ? props.value.value : ''}</span>
    </button>
  );
}
```

### 8.2 Gallery with Selection Pattern

```typescript
import { useClickActionHelper } from '@mendix/widget-plugin-grid/helpers/ClickActionHelper';
import {
  useSelectionHelper,
  getColumnAndRowBasedOnIndex,
} from '@mendix/widget-plugin-grid/selection';
import { observer } from 'mobx-react-lite';

const Gallery = observer(function Gallery(props: GalleryContainerProps) {
  const items = props.datasource.items ?? [];

  // Selection helper
  const selectionHelper = useSelectionHelper(
    props.itemSelection,
    props.datasource,
    props.onSelectionChange
  );

  // Click action helper
  const clickActionHelper = useClickActionHelper({
    onClick: props.onClick,
    onClickTrigger: props.onClickTrigger,
  });

  return (
    <div className={classNames('widget-gallery', props.class)}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className={classNames('gallery-item', {
            selected: selectionHelper.isSelected(item),
          })}
          onClick={() => {
            selectionHelper.onSelect(item);
            clickActionHelper.onClick(item);
          }}
        >
          {props.content.get(item)}
        </div>
      ))}
    </div>
  );
});
```

### 8.3 DataGrid Filter Pattern

```typescript
import { contains, attribute, literal, and, or } from 'mendix/filters/builders';

function applySearchFilter(
  datasource: ListValue,
  searchTerm: string,
  searchAttributes: ListAttributeValue<string>[]
) {
  if (!searchTerm.trim()) {
    datasource.setFilter(undefined);
    return;
  }

  const conditions = searchAttributes.map((attr) =>
    contains(attribute(attr.id), literal(searchTerm))
  );

  const filter = conditions.length === 1 ? conditions[0] : or(...conditions);

  datasource.setFilter(filter);
}
```

---

## 9. Testing Utilities

From `@mendix/widget-plugin-test-utils`:

```typescript
import {
  EditableValueBuilder,
  ListValueBuilder,
  ListAttributeValueBuilder,
  actionValue,
  dynamicValue,
} from '@mendix/widget-plugin-test-utils';

// Create mock EditableValue
const mockValue = new EditableValueBuilder<string>().withValue('test').isReadOnly(false).build();

// Create mock ListValue
const mockList = new ListValueBuilder()
  .withItems([{ id: '1' }, { id: '2' }, { id: '3' }] as ObjectItem[])
  .withTotalCount(3)
  .build();

// Create mock ListAttributeValue
const mockAttribute = new ListAttributeValueBuilder()
  .withId('name')
  .withType('String')
  .withGet((item) => dynamicValue('Item ' + item.id))
  .build();

// Create mock ActionValue
const mockAction = actionValue(true, false, jest.fn());
```

---

## 10. Key Patterns Summary

| Pattern                     | When to Use                                       |
| --------------------------- | ------------------------------------------------- |
| `executeAction(action)`     | Always wrap action execution for null safety      |
| `isAvailable(value)`        | Check before accessing DynamicValue/EditableValue |
| `observer()`                | Wrap components using MobX observables            |
| `useCallback()`             | Memoize event handlers                            |
| Filter builders             | Programmatic datasource filtering                 |
| `ListWidgetValue.get(item)` | Render nested widgets per list item               |
| Selection helpers           | Handle single/multi selection                     |

---

## 11. Sources

- https://docs.mendix.com/apidocs-mxsdk/apidocs/pluggable-widgets-property-types/
- https://docs.mendix.com/apidocs-mxsdk/apidocs/pluggable-widgets-client-apis-list-values/
- https://github.com/mendix/web-widgets (official widget implementations)
- https://github.com/mendix/widgets-resources (tooling and generators)

---

**Next Steps for Validation:**

1. Test property types in a new widget project
2. Verify filter builders work with SP11.5
3. Test selection APIs with DataGrid 2
4. Validate testing utilities installation
