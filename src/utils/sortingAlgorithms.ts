export interface SortingStep {
  array: number[];
  comparingIndices: number[];
  swappedIndices: number[];
  description: string;
}

export const generateRandomArray = (size: number, min: number = 5, max: number = 100): number[] => {
  console.log('Generating random array of size:', size);
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * (max - min) + min));
  console.log('Generated array:', arr);
  return arr;
};

export function* bubbleSort(array: number[]): Generator<SortingStep> {
  console.log('Starting bubble sort');
  const arr = [...array];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      console.log(`Comparing elements at indices ${j} and ${j + 1}`);
      yield {
        array: [...arr],
        comparingIndices: [j, j + 1],
        swappedIndices: [],
        description: `Comparing ${arr[j]} and ${arr[j + 1]}`
      };

      if (arr[j] > arr[j + 1]) {
        console.log(`Swapping ${arr[j]} and ${arr[j + 1]}`);
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield {
          array: [...arr],
          comparingIndices: [],
          swappedIndices: [j, j + 1],
          description: `Swapped ${arr[j]} and ${arr[j + 1]}`
        };
      }
    }
  }

  console.log('Bubble sort completed');
  yield {
    array: arr,
    comparingIndices: [],
    swappedIndices: [],
    description: 'Array is now sorted!'
  };
}

export function* mergeSort(array: number[]): Generator<SortingStep> {
  console.log('Starting merge sort');
  const arr = [...array];
  
  function* merge(start: number, middle: number, end: number): Generator<SortingStep> {
    console.log(`Merging subarrays: start=${start}, middle=${middle}, end=${end}`);
    const leftArray = arr.slice(start, middle + 1);
    const rightArray = arr.slice(middle + 1, end + 1);
    
    let i = 0;
    let j = 0;
    let k = start;
    
    while (i < leftArray.length && j < rightArray.length) {
      console.log(`Comparing ${leftArray[i]} and ${rightArray[j]}`);
      yield {
        array: [...arr],
        comparingIndices: [start + i, middle + 1 + j],
        swappedIndices: [],
        description: `Comparing ${leftArray[i]} and ${rightArray[j]}`
      };
      
      if (leftArray[i] <= rightArray[j]) {
        console.log(`Placing ${leftArray[i]} at position ${k}`);
        arr[k] = leftArray[i];
        yield {
          array: [...arr],
          comparingIndices: [],
          swappedIndices: [k],
          description: `Placing ${leftArray[i]} at position ${k}`
        };
        i++;
      } else {
        console.log(`Placing ${rightArray[j]} at position ${k}`);
        arr[k] = rightArray[j];
        yield {
          array: [...arr],
          comparingIndices: [],
          swappedIndices: [k],
          description: `Placing ${rightArray[j]} at position ${k}`
        };
        j++;
      }
      k++;
    }
    
    while (i < leftArray.length) {
      console.log(`Placing remaining element ${leftArray[i]} at position ${k}`);
      arr[k] = leftArray[i];
      yield {
        array: [...arr],
        comparingIndices: [],
        swappedIndices: [k],
        description: `Placing remaining element ${leftArray[i]} at position ${k}`
      };
      i++;
      k++;
    }
    
    while (j < rightArray.length) {
      console.log(`Placing remaining element ${rightArray[j]} at position ${k}`);
      arr[k] = rightArray[j];
      yield {
        array: [...arr],
        comparingIndices: [],
        swappedIndices: [k],
        description: `Placing remaining element ${rightArray[j]} at position ${k}`
      };
      j++;
      k++;
    }
  }
  
  function* mergeSortHelper(start: number, end: number): Generator<SortingStep> {
    if (start < end) {
      const middle = Math.floor((start + end) / 2);
      console.log(`Dividing array: start=${start}, middle=${middle}, end=${end}`);
      
      yield {
        array: [...arr],
        comparingIndices: [start, middle, end],
        swappedIndices: [],
        description: `Dividing array from index ${start} to ${end}`
      };
      
      yield* mergeSortHelper(start, middle);
      yield* mergeSortHelper(middle + 1, end);
      yield* merge(start, middle, end);
    }
  }
  
  yield* mergeSortHelper(0, arr.length - 1);
  
  console.log('Merge sort completed');
  yield {
    array: arr,
    comparingIndices: [],
    swappedIndices: [],
    description: 'Array is now sorted!'
  };
}

export function* quickSort(array: number[]): Generator<SortingStep> {
  console.log('Starting quick sort');
  const arr = [...array];

  function* partition(low: number, high: number): Generator<SortingStep> {
    const pivot = arr[high];
    let i = low - 1;
    console.log(`Partitioning array: low=${low}, high=${high}, pivot=${pivot}`);

    yield {
      array: [...arr],
      comparingIndices: [high],
      swappedIndices: [],
      description: `Choosing pivot: ${pivot}`
    };

    for (let j = low; j < high; j++) {
      console.log(`Comparing ${arr[j]} with pivot ${pivot}`);
      yield {
        array: [...arr],
        comparingIndices: [j, high],
        swappedIndices: [],
        description: `Comparing ${arr[j]} with pivot ${pivot}`
      };

      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          console.log(`Swapping ${arr[i]} and ${arr[j]}`);
          [arr[i], arr[j]] = [arr[j], arr[i]];
          yield {
            array: [...arr],
            comparingIndices: [],
            swappedIndices: [i, j],
            description: `Swapped ${arr[i]} and ${arr[j]}`
          };
        }
      }
    }

    if (i + 1 !== high) {
      console.log(`Moving pivot ${pivot} to position ${i + 1}`);
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      yield {
        array: [...arr],
        comparingIndices: [],
        swappedIndices: [i + 1, high],
        description: `Placed pivot ${pivot} in its final position`
      };
    }

    return i + 1;
  }

  function* quickSortHelper(low: number, high: number): Generator<SortingStep> {
    if (low < high) {
      console.log(`Sorting subarray: low=${low}, high=${high}`);
      const pi = yield* partition(low, high);
      yield* quickSortHelper(low, pi - 1);
      yield* quickSortHelper(pi + 1, high);
    }
  }

  yield* quickSortHelper(0, arr.length - 1);

  console.log('Quick sort completed');
  yield {
    array: arr,
    comparingIndices: [],
    swappedIndices: [],
    description: 'Array is now sorted!'
  };
}

export function* heapSort(array: number[]): Generator<SortingStep> {
  console.log('Starting heap sort');
  const arr = [...array];
  const n = arr.length;

  function* heapify(size: number, root: number): Generator<SortingStep> {
    console.log(`Heapifying at root ${root} with size ${size}`);
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size) {
      console.log(`Comparing root ${arr[largest]} with left child ${arr[left]}`);
      yield {
        array: [...arr],
        comparingIndices: [largest, left],
        swappedIndices: [],
        description: `Comparing root ${arr[largest]} with left child ${arr[left]}`
      };

      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }

    if (right < size) {
      console.log(`Comparing largest ${arr[largest]} with right child ${arr[right]}`);
      yield {
        array: [...arr],
        comparingIndices: [largest, right],
        swappedIndices: [],
        description: `Comparing largest ${arr[largest]} with right child ${arr[right]}`
      };

      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }

    if (largest !== root) {
      console.log(`Swapping ${arr[root]} with ${arr[largest]}`);
      [arr[root], arr[largest]] = [arr[largest], arr[root]];
      yield {
        array: [...arr],
        comparingIndices: [],
        swappedIndices: [root, largest],
        description: `Swapped ${arr[root]} with ${arr[largest]}`
      };

      yield* heapify(size, largest);
    }
  }

  // Build initial max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    console.log(`Building max heap at index ${i}`);
    yield {
      array: [...arr],
      comparingIndices: [i],
      swappedIndices: [],
      description: `Building max heap, processing index ${i}`
    };
    yield* heapify(n, i);
  }

  // Extract elements from heap one by one
  for (let i = n - 1; i > 0; i--) {
    console.log(`Moving largest element ${arr[0]} to position ${i}`);
    [arr[0], arr[i]] = [arr[i], arr[0]];
    yield {
      array: [...arr],
      comparingIndices: [],
      swappedIndices: [0, i],
      description: `Moving largest element ${arr[i]} to position ${i}`
    };

    yield* heapify(i, 0);
  }

  console.log('Heap sort completed');
  yield {
    array: arr,
    comparingIndices: [],
    swappedIndices: [],
    description: 'Array is now sorted!'
  };
}
