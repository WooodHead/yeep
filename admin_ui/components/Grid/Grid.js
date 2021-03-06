import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Grid child components
import GridPager from './GridPager';
import GridPerPage from './GridPerPage';
import GridHeadingCell from './GridHeadingCell';
import GridLoadingOverlay from './GridLoadingOverlay';

/**
 * Return a helpful message depending on the count of items we're showing on the grid
 * @param start - First item index
 * @param end - Last item index
 * @param total - Total items found
 * @returns {string|*}
 */
const getPaginationLabel = (start, end, total) => {
  if (total === 0) {
    return <strong>No results found</strong>;
  }
  return (
    <React.Fragment>
      Showing entities <strong>{start}</strong> to <strong>{end}</strong> of{' '}
      <strong>{total}</strong>:
    </React.Fragment>
  );
};

const Grid = ({
  headings,
  data,
  renderer,
  isLoading,
  className,
  entitiesStart,
  entitiesEnd,
  totalCount,
  hasNext,
  hasPrevious,
  onNextClick,
  onPreviousClick,
  onLimitChange,
}) => {
  return (
    <div className={classNames('grid relative', className)}>
      {isLoading && <GridLoadingOverlay />}
      <div className="py-2 text-center sm:flex sm:text-left">
        <p>{getPaginationLabel(entitiesStart, entitiesEnd, totalCount)}</p>
        <GridPager
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onNextClick={onNextClick}
          onPreviousClick={onPreviousClick}
        />
      </div>
      <style jsx>{`
        .grid-wrapper {
          max-width: calc(100vw - 2rem);
        }
      `}</style>
      <div className="grid-wrapper overflow-x-auto scrolling-touch">
        <table className="grid w-full border-collapse border-b border-grey">
          <thead>
            <tr>
              {headings.map((heading) => (
                <GridHeadingCell
                  key={heading.label}
                  label={heading.label}
                  isSortable={heading.isSortable}
                  sort={heading.sort}
                  className={heading.className}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              return renderer(row, i);
            })}
          </tbody>
        </table>
      </div>
      <div className="sm:flex flex-row text-center items-center py-2">
        <GridPerPage onChange={onLimitChange} />
        <GridPager
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onNextClick={onNextClick}
          onPreviousClick={onPreviousClick}
        />
      </div>
    </div>
  );
};

Grid.propTypes = {
  /*
    headings is an array of objects that look like this:
    {
      label: 'Name',
      isSortable: true,
      sort: 'asc',
      className: 'text-left',
    }
    Each element of the array will get passed to <GridHeadingCell />
   */
  headings: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      sort: PropTypes.oneOf(['asc', 'desc']),
      isSortable: PropTypes.bool,
      className: PropTypes.string,
    })
  ),
  // The data for the grid
  data: PropTypes.array.isRequired,
  // The function resposible for parsing each element of the "data" array above
  // and returning the apporpriate markup
  renderer: PropTypes.func,
  // Shows an overlay (effectively disabling the controls) if we're loading data
  isLoading: PropTypes.bool,
  // A custom className
  className: PropTypes.string,
  totalCount: PropTypes.number,
  hasNext: PropTypes.bool,
  hasPrevious: PropTypes.bool,
  onNextClick: PropTypes.func,
  onPreviousClick: PropTypes.func,
  onLimitChange: PropTypes.func,

  entitiesStart: PropTypes.number,
  entitiesEnd: PropTypes.number,
};

Grid.defaultProps = {
  isLoading: false,
  totalCount: 0,
};

export default Grid;
