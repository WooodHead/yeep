import React from 'react';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import Select from 'react-select';
import Grid from './grid/Grid';

/**
 * Wrapper for all pages, shows on the right of the Nav
 */
const PageWrapper = () => {
  return (
    <div className="leading-normal p-4 sm:p-8">
      <h1>Welcome to the Kitchen Sink</h1>
      <p className="mb-4">
        The aim of this page is to <strong>showcase all the various UI elements</strong> we plan to
        use in our app.
        <br />
        The default link colour iså blue: <a href="/">Example link</a>
      </p>
      <h2 className="mb-4">The &quot;Thumb&quot; principle</h2>
      <p className="mb-4">
        This will be a responsive app so we try to ensure that (with the possible exception of
        inline links!) any tappable area has a height of at least 40 pixels. This means that{' '}
        <code>&lt;input&gt;</code> fields, <code>&lt;select&gt;</code> elements, buttons will have
        that specific height.
      </p>
      <h2 className="mb-4">Button styles (this is an H2 subheading)</h2>
      <p className="mb-4">Default and secondary / lower priority buttons:</p>
      <p className="mb-4">
        <Button>I am the default button</Button>
      </p>
      <h2 className="mb-4">Secondary buttons</h2>
      <p className="mb-4">
        <Button isSecondary>I am a secondary button</Button>
      </p>
      <h2 className="mb-4">Form elements</h2>
      <p className="mb-6">
        A <code>&lt;fieldset&gt;</code> will be used to wrap labels and their form elements in most
        cases:
      </p>
      <fieldset className="mb-6">
        <legend>legend text here</legend>
        <p className="mb-4">
          In almost all of our forms we have a horizontal label + text field layout (which should
          collapse to a vertical layout in mobile viewports). Taking our cue from Bootstrap, we will
          wrap each label + field with a <code>.form-group</code> class to facilitate this.
        </p>
        <div className="form-group mb-4">
          <Input id="tempTextField" placeholder="The text field" label="The label:" />
        </div>
        <p className="mb-4">
          For viewports larger than Tailwinds 576px breakpoint the layout is as follows:
        </p>
        <ul className="mb-4">
          <li>
            The <code>&lt;label&gt;</code> will take 25% of the container width (this needs to be
            fine-tuned <em>after</em> we implement a few of our forms
          </li>
          <li>The text field / select element will take 50% of the container width</li>
          <li>Textareas take the full 75% of the container width</li>
          <li>Validation / neutral messages will appear underneath the form element</li>
        </ul>
        <div className="form-group mb-4">
          <Input
            id="tempTextField2"
            label="Another field:"
            placeholder="Another text field"
            feedbackInvalid="An error occurred with this field"
          />
        </div>
        <div className="form-group mb-4">
          <Input
            id="tempTextField3"
            label="This is good:"
            placeholder="placeholder text here"
            feedbackValid="Nice one!"
          />
        </div>
        <div className="form-group mb-4">
          <Textarea
            label="Helpful layout:"
            placeholder="Please write your innermost feelings"
            feedbackNeutral="we are joking, do not do this, just tell us a joke"
          />
        </div>
        <div className="form-submit">
          <p className="mb-4">
            Submit / cancel buttons can be wrapped inside a <code>.form-submit</code> helper div
            which gives the appropriate left margin:
          </p>
          <Button className="mr-3">Submit this form!</Button>
          <Button isSecondary>Cancel and hide</Button>
        </div>
      </fieldset>
      <fieldset className="mb-6">
        <legend>Dropdowns and password fields</legend>
        <p className="mb-4">A few different layouts and scenarios:</p>
        <div className="form-group mb-3">
          <label htmlFor="tempSelect1">Select / dropdown:</label>
          <Select
            className="flex-auto"
            placeholder="-- Please choose an option --"
            options={[
              { value: 1, label: 'Option 1' },
              { value: 2, label: 'Option 2' },
              { value: 3, label: 'Option 3' },
              { value: 4, label: 'Option 4' },
            ]}
            isClearable={true}
          />
        </div>
        <div className="form-group mb-3">
          <Input type="password" label="Password:" placeholder="please enter a strong password" />
        </div>
      </fieldset>
      <fieldset className="mb-6">
        <legend>Radio groups and checkbox groups</legend>
        <p className="mb-4">
          Groups of checkboxes or radios need to have multiple <code>&lt;label&gt;</code> elements,
          one for each checkbox (or radio). In this case <code>.form-group</code> cannot help us and
          we use Tailwind responsive width and flex classes to achieve the same results
        </p>
        <div className="sm:flex mb-3">
          <div className="sm:w-1/4">A &quot;fake&quot; label (div):</div>
          <div className="sm:w-3/4">
            <label htmlFor="tempRadio1_1" className="block">
              <input type="radio" name="tempRadio1" id="tempRadio1_1" className="mr-2" /> Radio
              group #1
            </label>
            <label htmlFor="tempRadio1_2" className="block">
              <input type="radio" name="tempRadio1" id="tempRadio1_2" className="mr-2" /> Radio
              group #2
            </label>
            <label htmlFor="tempRadio1_3" className="block">
              <input type="radio" name="tempRadio1" id="tempRadio1_3" className="mr-2" /> Radio
              group #3
            </label>
            <label htmlFor="tempRadio1_4" className="block">
              <input type="radio" name="tempRadio1" id="tempRadio1_4" className="mr-2" /> Radio
              group #4
            </label>
          </div>
        </div>
        <p className="mb-4">
          I opted to wrap the checkbox or radio button with the <code>&lt;label&gt;</code> element
          to ensure that no clicks / tap are lost if made in between the element and the label. This
          can change easily if it does not suit us.
        </p>
        <p className="mb-4">
          Removing the <code>.block</code> classes from each <code>&lt;label&gt;</code> will give us
          a horizontal layout:
        </p>
        <div className="sm:flex">
          <div className="sm:w-1/4">Horizontal layout:</div>
          <div className="sm:w-3/4">
            <label htmlFor="tempCheckbox1" className="mr-3">
              <input type="checkbox" id="tempCheckbox1" /> Checkbox #1
            </label>
            <label htmlFor="tempCheckbox2">
              <input type="checkbox" id="tempCheckbox2" /> Checkbox #2
            </label>
          </div>
        </div>
      </fieldset>
      <h2 className="mb-4">Filters bar</h2>
      <p className="mb-6">
        A fieldset with <code>.flex</code> and a few tailwind helper classes in the elements inside
        give us our Filters bar:
      </p>
      <fieldset className="mb-4">
        <legend>Filters and quick search</legend>
        <div className="sm:flex items-center">
          <Select
            className="flex-auto mb-3 sm:mb-0 sm:mr-3"
            placeholder="All organisations"
            options={[
              { value: 1, label: 'Org 1' },
              { value: 2, label: 'Org 2' },
              { value: 3, label: 'Org 3' },
              { value: 4, label: 'Org 4' },
            ]}
            isClearable={true}
          />
          <Select
            className="flex-auto mb-3 sm:mb-0 sm:mr-3"
            placeholder="All roles"
            options={[
              { value: 1, label: 'Role 1' },
              { value: 2, label: 'Role 2' },
              { value: 3, label: 'Role 3' },
            ]}
            isClearable={true}
          />
          <a href="/admin" className="block whitespace-no-wrap mb-3 sm:mb-0 sm:mr-3">
            Toggle profile pics <strong>ON</strong>
          </a>
          <Input placeholder="quicksearch" />
        </div>
      </fieldset>
      <p className="italic text-grey-dark text-sm mb-4">
        Note: We probably need to fine tune the breakpoint for the Filters bars above so that it
        collapses to a vertical layout in the md or lg breakpoint instead of sm. To be discussed.
      </p>
      <h2 className="mb-4">Our grid</h2>
      <p className="mb-4">
        We will implement a custom grid control. The &quot;easy way out&quot; is a normal table with
        a scrolling wrapping pane (auto-sizing of column widths <em>is</em> important here and the
        biggest benefit we get. Hence the TBD if this will be the final markup).
      </p>
      <Grid />
      <p className="italic text-grey-dark text-sm my-4">
        Note: If we end up using the wrapping canvas for the mobile viewport we probably need to add
        a scrolling shadow effect to indicate to the user that they can pan and scroll the grid
        control in their mobile.
      </p>
      <h2 className="mb-4">Permission / Role pillboxes</h2>
      <p className="mb-4">
        These are custom-styled <code>&lt;label&gt;</code> elements with nested checkboxes:
      </p>
      <label htmlFor="permission1" className="pillbox mr-2">
        <input type="checkbox" id="permission1" /> Permission #1
      </label>
      <label htmlFor="permission5" className="pillbox pillbox-checked mr-2">
        <input type="checkbox" id="permission5" checked="true" /> Permission #2
      </label>
      <label htmlFor="permission3" className="pillbox mr-2">
        <input type="checkbox" id="permission3" /> Permission #3
      </label>
    </div>
  );
};

export default PageWrapper;
